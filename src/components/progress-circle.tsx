import Svg, { Circle, Path } from 'react-native-svg';

type Props = { size: number; fraction: number; color: string; ring: string };

/** A checkbox circle that fills like a pie chart; full shows a tick. */
export function ProgressCircle({ size, fraction, color, ring }: Props) {
  const r = size / 2;
  const f = Math.max(0, Math.min(1, fraction));
  const stroke = 2;
  const inner = r - stroke - 1.5; // pie radius, leaving a gap inside the ring

  // Pie slice from 12 o'clock, clockwise.
  let slice = '';
  if (f > 0 && f < 1) {
    const a = f * 2 * Math.PI;
    const x = r + inner * Math.sin(a);
    const y = r - inner * Math.cos(a);
    slice = `M ${r} ${r} L ${r} ${r - inner} A ${inner} ${inner} 0 ${f > 0.5 ? 1 : 0} 1 ${x} ${y} Z`;
  }

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {f >= 1 ? (
        <>
          <Circle cx={r} cy={r} r={r - stroke / 2} fill={color} stroke={color} strokeWidth={stroke} />
          <Path
            d={`M ${size * 0.3} ${size * 0.52} L ${size * 0.44} ${size * 0.66} L ${size * 0.71} ${size * 0.36}`}
            stroke="#fff"
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </>
      ) : (
        <>
          <Circle cx={r} cy={r} r={r - stroke / 2} fill="none" stroke={f > 0 ? color : ring} strokeWidth={stroke} />
          {slice ? <Path d={slice} fill={color} /> : null}
        </>
      )}
    </Svg>
  );
}
