import { describe, it, expect } from 'vitest';
import { SPRING_SNAPPY, SPRING_DRAG, SPRING_DRAWER, SPRING_BOUNCE } from '@/components/ui/motion/spring-presets';

describe('Motion Spring Presets', () => {
  it('exports tuned physics parameters conforming to spec', () => {
    expect(SPRING_SNAPPY.stiffness).toBe(450);
    expect(SPRING_SNAPPY.damping).toBe(30);
    expect(SPRING_DRAG.stiffness).toBe(320);
    expect(SPRING_DRAG.damping).toBe(24);
    expect(SPRING_DRAWER.stiffness).toBe(380);
    expect(SPRING_DRAWER.damping).toBe(32);
    expect(SPRING_BOUNCE.stiffness).toBe(500);
    expect(SPRING_BOUNCE.damping).toBe(20);
  });
});
