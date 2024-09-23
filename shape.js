/* Intersection class:
 * t:        ray parameter, i.e. distance of the intersection point to ray's origin
 * position: position (THREE.Vector3) of intersection point
 * normal:   normal (THREE.Vector3) of intersection point
 * material: material of the intersection object
 */
class Intersection {
	constructor() {
		this.t = 0;
		this.position = new THREE.Vector3();
		this.normal = new THREE.Vector3();
		this.material = null;
	}
	set(isect) {
		this.t = isect.t;
		this.position = isect.position;
		this.normal = isect.normal;
		this.material = isect.material;
	}
}

// Intersect is meant to find parameter t and other defined features of this intersection point. It returns NULL when t is out of range or if the shape is not intersected at all

/* Plane class. This class is fully implemented for you
 * P0: a point (THREE.Vector3) that the plane passes through
 * n:  plane's normal (THREE.Vector3)
 */
class Plane {
	constructor(P0, n, material) {
		this.P0 = P0.clone();
		this.n = n.clone();
		this.n.normalize();
		this.material = material;
	}
	// Given ray and range [tmin,tmax], return intersection point.
	// Return null if no intersection.
	intersect(ray, tmin, tmax) {
		let temp = this.P0.clone();
		temp.sub(ray.o); // (P0-O)
		let denom = ray.d.dot(this.n); // d.n
		if(denom==0) { return null;	}
		let t = temp.dot(this.n)/denom; // (P0-O).n / d.n
		if(t<tmin || t>tmax) return null; // check range
		let isect = new Intersection();   // create intersection structure
		isect.t = t;
		isect.position = ray.pointAt(t);
		isect.normal = this.n;
		isect.material = this.material;
		return isect;
	}
}

/* Sphere shape
 * C: center of sphere (type THREE.Vector3)
 * r: radius
 */
class Sphere {
	constructor(C, r, material) {
		this.C = C.clone();
		this.r = r;
		this.r2 = r*r;
		this.material = material;
	}
	intersect(ray, tmin, tmax) {
// ===YOUR CODE STARTS HERE===
		// OOP: Make copy to do vector multiplication. do arithmetic with clones for formula to find t. Check if t in range, set intersection. pick smaller t value
		// Remember: Ray.o = O = origin. C is sphere center, r is radius. 
		let B, C; // A is automatically 1 since d is normalized
		if(ray.o == undefined){ console.log("yes");}
		let temp1 = ray.o.clone(); let temp2 = ray.o.clone(); //Temp made so we can multiply and subtract from it without harming O
		B = (temp1.sub(this.C).multiplyScalar(2)).dot(ray.d); // 2(O-C)*d
		let OC = temp2.sub(this.C); // (O-C)
		C = OC.dot(OC) - (this.r2); // |O-C|^2 - r^2

		let delta = B*B - 4*C;
		if(delta < 0){ //If delta is less than 0, no intersection
			return null;
		}

		// All other code goes on because delta is above or equal to 0, so there will be one or two intersections, to be determined below
		let t0 = ((-1)*B + Math.sqrt(delta)) / 2 ;// Quadratic formula with +
		let t1 = ((-1)*B - Math.sqrt(delta)) / 2 ; // Quadratic formula with -
		
		// Now that t0 and t1 are computed, need to pick the smallest t value that is in within the range of tmin tmax
		let t; // To be assigned to the t that will win the below switches
		if(t0 <tmin || t0>tmax) t0 = null;
		if(t1 <tmin || t1>tmax) t1 = null;
		let t0N = t0 == null; let t1N = t1 == null;
		if(t0N || t1N){ // If either are null
			if(t0N == t1N) return null; //Both are null, return null cause no intersection
			t = t1N ? t0: t1; // One is null, one isnt. Find which isnt and thats our t
			// If t1 is null pick t0, else pick t1
		}
		else{ 
			t = Math.min(t0,t1);
		} //Both in range so pick smallest

		// Put together result and return
		let isect = new Intersection();
		isect.t = t;
		isect.position = ray.pointAt(t);
		isect.normal = isect.position.clone().sub(this.C).normalize(); //Slides: normal of the isect point is the vector (P-C) nromalized. P = ray.
		isect.material = this.material;
		
		return isect;

// ---YOUR CODE ENDS HERE---
	}
}

class Triangle {
	/* P0, P1, P2: three vertices (type THREE.Vector3) that define the triangle
	 * n0, n1, n2: normal (type THREE.Vector3) of each vertex */
	constructor(P0, P1, P2, material, n0, n1, n2) {
		this.P0 = P0.clone();
		this.P1 = P1.clone();
		this.P2 = P2.clone();
		this.material = material;
		if(n0) this.n0 = n0.clone();
		if(n1) this.n1 = n1.clone();
		if(n2) this.n2 = n2.clone();

		// below you may pre-compute any variables that are needed for intersect function
		// such as the triangle normal etc.
// ===YOUR CODE STARTS HERE===
		let A = this.P1.clone().sub(this.P0); let B = this.P2.clone().sub(this.P0);
		this.n = A.cross(B).normalize();
// ---YOUR CODE ENDS HERE---
	} 

	intersect(ray, tmin, tmax) {
// ===YOUR CODE STARTS HERE===
		let t, alpha, beta, gamma;

		let a = ray.d.clone(); let d = this.P2.clone().sub(ray.o);
		let b = this.P2.clone().sub(this.P0); let c = this.P2.clone().sub(this.P1);

		let denom = new THREE.Matrix3();	
		denom = denom.set(	a.x,b.x,c.x,
							a.y,b.y,c.y,
							a.z,b.z,c.z	).determinant();
		let tNum = 	new THREE.Matrix3();
		tNum = tNum.set(d.x,b.x,c.x,
						d.y,b.y,c.y,
						d.z,b.z,c.z ).determinant();
		let alphaNum = 	new THREE.Matrix3();
		alphaNum = alphaNum.set(a.x,d.x,c.x,
								a.y,d.y,c.y,
								a.z,d.z,c.z ).determinant();
		let betaNum = new THREE.Matrix3();
		betaNum = betaNum.set(	a.x,b.x,d.x,
								a.y,b.y,d.y,
								a.z,b.z,d.z ).determinant();

		t = tNum / denom;
		alpha = alphaNum / denom;
		beta = betaNum / denom;
		gamma = 1 - alpha - beta;

		if(alpha < 0 || beta < 0 || t < 0 || (alpha+beta) > 1 || t<tmin || t>tmax){
			return null;
		}

		let isect = new Intersection();
		isect.t = t;
		isect.position = ray.pointAt(t);
		if(this.n0 != null && this.n1 != null && this.n2 != null){
			isect.normal = this.n0.clone().multiplyScalar(alpha).add(this.n1.clone().multiplyScalar(beta)).add(this.n2.clone().multiplyScalar(gamma)).normalize(); // n = (alpha * n0 + beta * n1 + gamma n2).normalize(); Hence we need to compute these!
			console.log(isect.normal);
		}
		else{
			isect.normal = this.n;
		}
		isect.material = this.material;
// ---YOUR CODE ENDS HERE---
		return isect;
	}
}

function shapeLoadOBJ(objstring, material, smoothnormal) { //Takes obj and puts its triangles into shapes array
	loadOBJFromString(objstring, function(mesh) { // callback function for non-blocking load
		if(smoothnormal) mesh.computeVertexNormals();
		for(let i=0;i<mesh.faces.length;i++) {
			let p0 = mesh.vertices[mesh.faces[i].a];
			let p1 = mesh.vertices[mesh.faces[i].b];
			let p2 = mesh.vertices[mesh.faces[i].c];
			if(smoothnormal) {
				let n0 = mesh.faces[i].vertexNormals[0];
				let n1 = mesh.faces[i].vertexNormals[1];
				let n2 = mesh.faces[i].vertexNormals[2];
				shapes.push(new Triangle(p0, p1, p2, material, n0, n1, n2));
			} else {
				shapes.push(new Triangle(p0, p1, p2, material));
			}
		}
	}, function() {}, function() {});
}

