/* LightSample class:
 * intensity: intensity of the light sample (THREE.Color3) 
 * position:  position of the light sample (THREE.Vector3)
 * direction: light vector (i.e. *normalized* direction from shading point to the sample)
 */
class LightSample {
	constructor() {
		this.intensity = null;
		this.position = null;
		this.direction = null;
	}
}

/* PointLight class. This class is fully implemented for you */
class PointLight {
	constructor(position, intensity) {
		this.position = position.clone();
		this.intensity = intensity.clone();
	}
	/* getLight returns a LightSample object
	 * for a given a shading point.
	 */
	getLight(shadingPoint) { // All light classes have this. Takes position of shading point returns light sample. This sample has intensity and position of light point, and direction from shading to point
		let ls = new LightSample();
		ls.position = this.position.clone();
		ls.direction = this.position.clone();
		ls.direction.sub(shadingPoint);
		ls.intensity = this.intensity.clone();
		ls.intensity.multiplyScalar(1/ls.direction.lengthSq());	// quadratic falloff of intensity
		ls.direction.normalize(); // The direction is the light vector in the shading formula. Goes from shading point to light point made here
		return ls;
	}
}

/* SpotLight class */
class SpotLight {
	/* from: position of spot light
	 * to:   target the light is pointing to
	 * exponent: akin to specular highlight's shininess
	 * cutoff: angle cutoff (i.e. 15 degrees etc.)
	 */
	constructor(from, to, intensity, exponent, cutoff) {
		this.from = from.clone();
		this.to = to.clone();
		this.intensity = intensity.clone();
		this.exponent = exponent;
		this.cutoff = cutoff;
	}
	getLight(shadingPoint) {
// ===YOUR CODE STARTS HERE===
		let ls = new LightSample();
		ls.position = this.from.clone();
		//ls.direction = this.to.clone().sub(this.from).normalize();
		let sAxis = this.from.clone().sub(this.to);
		let pfrom = this.from.clone().sub(shadingPoint);
		ls.direction = pfrom.clone().normalize();
		let cosA = sAxis.normalize().dot(ls.direction); // cos(alpha) where alpha is angle between axis and ray from shading point to form
		if(cosA < Math.cos(this.cutoff*(Math.PI/180))){
			ls.intensity = new THREE.Color(0,0,0);
		}
		else{
			ls.intensity = this.intensity.clone().multiplyScalar(1/pfrom.lengthSq()).multiplyScalar(Math.pow(cosA,this.exponent));
		}
		return ls;
// ---YOUR CODE ENDS HERE---
	}
}

// approximate an area light by discretizing it into NsxNs point lights
function createAreaLight(center, size, intensity, Ns) {
	intensity.multiplyScalar(size*size/Ns/Ns);	// each sampled light represents a fraction of the total intensity
	for(let j=0;j<Ns;j++) {
		for(let i=0;i<Ns;i++) {
			let position = new THREE.Vector3(center.x+(i/Ns-0.5)*size, center.y, center.z+(j/Ns-0.5)*size);
			lights.push(new PointLight(position, intensity));
		}
	}
}

