/* Shared scroll response for the showreel and portrait. Placement stays with each section. */
(() => {
  const settings = Object.freeze({
    maximumDegrees: 32,
    velocityGain: .015,
    perspectiveRem: 43.75,
    pitchRatio: .6,
    response: 10
  });

  function edgeRamp(distance, span) {
    const t = Math.max(0, Math.min(1, distance / span));
    return t * t * (3 - 2 * t);
  }

  function mix(from, to, progress) {
    return from + (to - from) * progress;
  }

  // Both anchors and the containing block are measured in the same viewport frame.
  function place(element, from, to, container, progress) {
    const style = element.style;
    style.left = (mix(from.left, to.left, progress) - container.left) + 'px';
    style.top = (mix(from.top, to.top, progress) - container.top) + 'px';
    style.width = mix(from.width, to.width, progress) + 'px';
    style.height = mix(from.height, to.height, progress) + 'px';
  }

  window.JKScrollMediaMotion = Object.freeze({
    settings,
    edgeRamp,
    mix,
    place,
    approach(angle, velocity, deltaMs = 16.667) {
      const target = Math.max(-settings.maximumDegrees, Math.min(settings.maximumDegrees, velocity * settings.velocityGain));
      return angle + (target - angle) * (1 - Math.exp(-settings.response * Math.min(deltaMs, 50) / 1000));
    },
    endpointWeight(progress) {
      return edgeRamp(Math.min(progress, 1 - progress), .22);
    },
    updateTilt(face, angle, velocity, deltaMs, progress, strength = 1) {
      const next = progress > 0 && progress < 1 ? this.approach(angle, velocity, deltaMs) : 0;
      face.style.transform = this.transform(next * this.endpointWeight(progress) * strength);
      return next;
    },
    transform(angle) {
      return 'perspective(' + settings.perspectiveRem + 'rem) rotateX(' + (-angle * settings.pitchRatio) + 'deg) rotateY(' + angle + 'deg)';
    }
  });
})();
