export interface CubicBezier {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    x3: number;
    y3: number;
}
export declare function reverseCurve(curve: CubicBezier): CubicBezier;
export declare function normalizeCurve(curve: CubicBezier): CubicBezier;
export declare function partialCurveFrom(curve: CubicBezier, xstart: number, xend: number): CubicBezier;
export declare function animation_curve(cpx1: number, cpy1: number, cpx2: number, cpy2: number): CubicBezier;
export declare let ease_in: CubicBezier;
export declare let ease_out: CubicBezier;
export declare let ease_in_out: CubicBezier;
export declare let ease: CubicBezier;
export declare let linear: CubicBezier;
