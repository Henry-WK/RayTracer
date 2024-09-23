/* Ray class:
 * o: origin (THREE.Vector3)
 * d: normalized direction (THREE.Vector3)
 */
class Ray {
	constructor(origin, direction) {
		this.o = origin.clone();
		this.d = direction.clone();
		this.d.normalize();
	}
	pointAt(t) { //Computes a point P(t) given t param
		// P(t) = o + t*d
		let point = this.o.clone();
		point.addScaledVector(this.d, t);
		return point;
	}
	direction() { return this.d; }
	origin() { return this.o; }
}

function render() {
	// create canvas of size imageWidth x imageHeight and add to HTML DOM
	let canvas = document.createElement('canvas');
	canvas.width = imageWidth;
	canvas.height = imageHeight;
	canvas.style = 'background-color:red';
	document.body.appendChild(canvas);
	let ctx2d = canvas.getContext('2d'); // get 2d context
	let image = ctx2d.getImageData(0, 0, imageWidth, imageHeight); // get image data
	let pixels = image.data; // get pixel array

	let row=0;
	let idx=0;
	let chunksize=10; // render 10 rows at a time
	console.log('Raytracing started...');
	(function chunk() {
		// render a chunk of rows
		for(let j=row;j<row+chunksize && j<imageHeight;j++) {
			for(let i=0;i<imageWidth;i++,idx+=4) { // i loop
				// compute normalized pixel coordinate (x,y)
				let x = i/imageWidth;
				let y = (imageHeight-1-j)/imageHeight;
				let ray = camera.getCameraRay(x,y);
				let color = raytracing(ray, 0);
				setPixelColor(pixels, idx, color);
			}
		}
		row+=chunksize;  // non-blocking j loop
		if(row<imageHeight) {
			setTimeout(chunk, 0);
			ctx2d.putImageData(image, 0, 0); // display intermediate image
		} else {
			ctx2d.putImageData(image, 0, 0); // display final image
			console.log('Done.')
		}
	})();
}

/* Trace ray in the scene and return the shading color of ray. 'depth' is the current recursion depth.
 * If intersection material has non-null kr or kt, perform recursive ray tracing. */

// Call rayIntersectScene and is no intersection found return background color, else compute and reutnr ambient color. 
// This should be the first function I complete, and I can test it by running 0.ambient to check that my ambient color is correct
function raytracing(ray, depth) {
	let color = new THREE.Color(0,0,0);
// ===YOUR CODE STARTS HERE===

	// Start with running ray intersection scene from step 1. Depending on result, return background or ambient light
	if(ray.o == undefined){ console.log("bruh")}
	let isect = rayIntersectScene(ray);
	if(isect == null){ // No intersection, return background color
		// Return background color
		color = backgroundColor;
	}
	else{ //Compute recursively ambient color
		let mat = isect.material;
		if(mat.kr != null || mat.kt != null){
			if(depth < maxDepth){
				let shadingPoint = isect.position;
				if(mat.kr != null){
					if(ray.d.clone().negate().dot(isect.normal) > 0){ // Want to check that the ray is on the same side as shading point
						let refl_ray = new Ray(shadingPoint, reflect(ray.d.clone().negate(),isect.normal));
						color.add(mat.kr.clone().multiply(raytracing(refl_ray,depth+1)));
					}
				} //Reflection, need to account for it
				if(mat.kt != null) {
					let refr = refract(ray.d,isect.normal,mat.ior);
					if(refr != null){ // To avoid total internal reflection, make sure refract is not null
						let refr_ray = new Ray(shadingPoint, refr);
						color.add(mat.kt.clone().multiply(raytracing(refr_ray,depth+1)));
					}
				} // Refract, function reftract expects shading into P
			}
		}
		else{
			color = shading(ray,isect);
			let Ia = ambientLight.clone().multiply(mat.ka);
			color.add(Ia);
		}
	}

// ---YOUR CODE ENDS HERE---
	return color;
}

/* Compute and return shading color given a ray and the intersection point structure. */
function shading(ray, isect) {
	let color = new THREE.Color(0,0,0);
// ===YOUR CODE STARTS HERE===
	// We have entered this function because there was not refraction and not reflected, just normal material. Thus we loop through light sources and find color
	for(let i = 0; i < lights.length; i++){
		let shadingPoint = isect.position; //Intersection point on shape
		let ls = lights[i].getLight(shadingPoint); // light sample object creation. Has position, direction, and intensity
		let shadowRay = new Ray(shadingPoint, ls.direction); // shadow ray is the shading point to the light source. Tells whether we are shadowed and used for computation
		let distToLight = (ls.position.clone().sub(shadingPoint)).length(); // distance from point on light sample object to position on intersection
		let shadow_isect = rayIntersectScene(shadowRay); // shadow intersect based on shadow ray that goes from intersection to light source

		if(shadow_isect && shadow_isect.t < distToLight){ // If intersection isn't null and t is less than distance then this is a shadow, dont shade!
			continue; //Breaks out of loop and continues to next light source
		}
		
		// Compute shading
		let mat = isect.material; // Material to consider from the shape itself
		let Is = new THREE.Color(0,0,0); let Id = new THREE.Color(0,0,0); //Initalize to nothing, changes given proper material
		let l = ls.direction.clone(); let n = isect.normal.clone(); let v = ray.d.clone().negate(); let r = reflect(l,n); 
		// Mirror and glass are not being done here as it is already accounted for in raytracing
		if(mat.ks != null){ //Phong, has ks
			//let r = reflect(ray.d.clone().negate(), isect.normal); //mirror reflection direction r = 2(l * n)n - l
			Is = ls.intensity.clone().multiply(mat.ks).multiplyScalar(Math.pow(Math.max(r.dot(v),0),mat.p))
		}
		// Diffuse, has no ks, kr, and kt so must be since all others do
		// Formula: Id = intensity of light (ls.intensity, color) * kd () * (intersect normal (vector) * shadowRay (vector))
		Id = ls.intensity.clone().multiply(mat.kd).multiplyScalar(Math.max(n.dot(l),0));
		
		//let currColor = Is.add(Id); // This is the addition of Is and Id if the material is either phong or diffuse
		let currColor = Is.add(Id);
		color.add(currColor); // Summation of all the colors found for each light source
	}
// ---YOUR CODE ENDS HERE---
	return color;
}

/* Compute intersection of ray with scene shapes.
 * Return intersection structure (null if no intersection). */
function rayIntersectScene(ray) {
	let tmax = Number.MAX_VALUE;
	let isect = null;
	for(let i=0;i<shapes.length;i++) { // This loops through the all the shapes and sees ifwe intersect with any of them. If so, we make sure it is closest as it is within tmax, then update if so
		let hit = shapes[i].intersect(ray, 0.0001, tmax);
		if(hit != null) {
			tmax = hit.t; // update t
			isect = hit;  // update isect
		}
	}
	return isect;
}

/* Compute reflected vector, by mirroring l around n.
 * Both l and n are assumed to be pointing away from the shading point
 */
function reflect(l, n) {
	// r = 2(n.l)*n-l
	let r = n.clone();
	r.multiplyScalar(2*n.dot(l));
	r.sub(l);
	return r;
}

/* Compute refracted vector, given l, n and index_of_refraction.
 * l is assuming to be pointing INTO the shading point
 * n points away from the shading point
 */
function refract(l, n, ior) {
	let mu = (n.dot(l) < 0) ? 1/ior:ior;
	let cosI = l.dot(n);
	let sinI2 = 1 - cosI*cosI;
	if(mu*mu*sinI2>1) return null;
	let sinR = mu*Math.sqrt(sinI2);
	let cosR = Math.sqrt(1-sinR*sinR);
	let r = n.clone();
	if(cosI > 0) {
		r.multiplyScalar(-mu*cosI+cosR);
		r.addScaledVector(l, mu);
	} else {
		r.multiplyScalar(-mu*cosI-cosR);
		r.addScaledVector(l, mu);
	}
	r.normalize();
	return r;
}

/* Convert floating-point color to integer color and assign it to the pixel array. */
function setPixelColor(pixels, index, color) {
	pixels[index+0]=pixelProcess(color.r);
	pixels[index+1]=pixelProcess(color.g);
	pixels[index+2]=pixelProcess(color.b);
	pixels[index+3]=255; // alpha channel is always 255*/
}

/* Multiply exposure, clamp pixel value, then apply gamma correction. */
function pixelProcess(value) {
	value*=exposure; // apply exposure
	value=(value>1)?1:value;
	value = Math.pow(value, 1/2.2);	// 2.2 gamma correction
	return value*255;
}
