import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { DateField } from '@/components/date-field';
import { Dropdown } from '@/components/dropdown';
import { usePalette } from '@/constants/tally';
import { addDaysStr, prettyDate } from '@/lib/dates';
import { customRule, repeatPatch, unitOf, type Unit } from '@/lib/repeat';
import { streak } from '@/lib/recurrence';
import type { AllCompletions } from '@/lib/views';
import type { DateStr, Item, Rule } from '@/lib/types';

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const UNITS: Unit[] = ['day', 'week', 'month'];

type Props = {
  item: Item;
  today: DateStr;
  completions: AllCompletions;
  set: (patch: Partial<Item>) => void;
};

/** Repeat switch, "every N day/week/month" controls, start and end dates, and missed-day behaviour. */
export function RepeatEditor({ item, today, completions, set }: Props) {
  const c = usePalette();
  const r = item.rule;
  const start = item.startDate ?? today;
  const setRule = (rule: Rule) => set({ rule });
  const every = r ? unitOf(r) : null;

  const chip = (on: boolean) => [
    styles.chip,
    { borderColor: on ? c.accent : c.line, backgroundColor: on ? c.accent : c.bg },
  ];
  const chipText = (on: boolean) => ({ color: on ? '#fff' : c.ink, fontSize: 13 });
  const label = [styles.label, { color: c.muted }];

  const dayChips = (rule: Extract<Rule, { type: 'weekly' }>) => (
    <View style={styles.chips}>
      {DAYS.map((d, i) => {
        const on = rule.days.includes(i);
        return (
          <Pressable
            key={d}
            // Keep at least one day, or the task would never show up.
            onPress={() =>
              on
                ? rule.days.length > 1 && setRule({ ...rule, days: rule.days.filter((x) => x !== i) })
                : setRule({ ...rule, days: [...rule.days, i].sort() })
            }
            style={[chip(on), styles.day]}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: on }}
            accessibilityLabel={d}>
            <Text style={chipText(on)}>{d}</Text>
          </Pressable>
        );
      })}
    </View>
  );

  return (
    <>
      <View style={styles.switchRow}>
        <Text style={{ color: c.ink, fontSize: 15 }}>↻ Repeat</Text>
        <Switch
          value={!!r}
          onValueChange={(on) => set(repeatPatch(item, on ? 'daily' : 'none', today))}
          trackColor={{ true: c.accent }}
          accessibilityLabel="Repeat"
        />
      </View>

      {r && every && (
        <>
          <View style={styles.stepper}>
            <Stepper
              before="Every"
              after=""
              value={every.interval}
              onChange={(n) => setRule(customRule(every.unit, n, start, r))}
            />
            <Dropdown
              label="Repeat unit"
              value={every.unit}
              onChange={(u) => setRule(customRule(u, every.interval, start, r))}
              options={UNITS.map((u) => ({ value: u, label: every.interval === 1 ? u : `${u}s` }))}
            />
          </View>
          {r.type === 'weekly' && dayChips(r)}
          {r.type === 'weekdays' && dayChips({ type: 'weekly', days: [1, 2, 3, 4, 5], interval: 1 })}
          {r.type === 'monthly' && (
            <>
              <Stepper
                before="On day"
                after="of the month"
                value={r.dom}
                max={31}
                onChange={(dom) => setRule({ ...r, dom })}
              />
              {r.dom > 28 && (
                <Text style={[styles.hint, { color: c.muted }]}>In shorter months it falls on the last day.</Text>
              )}
            </>
          )}
        </>
      )}

      {r && (
        <>
          <Text style={[label, styles.gapTop]}>Starts</Text>
          <DateField value={item.startDate} onChange={(d) => set({ startDate: d })} placeholder="Start date" />

          <Text style={[label, styles.gapTop]}>Ends</Text>
          <View style={styles.chips}>
            <Pressable
              accessibilityRole="button"
              onPress={() => set({ endDate: undefined })}
              style={chip(!item.endDate)}>
              <Text style={chipText(!item.endDate)}>Never</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => !item.endDate && set({ endDate: addDaysStr(item.startDate ?? today, 30) })}
              style={chip(!!item.endDate)}>
              <Text style={chipText(!!item.endDate)}>On a date</Text>
            </Pressable>
          </View>
          {item.endDate && (
            <>
              <DateField value={item.endDate} onChange={(d) => set({ endDate: d })} placeholder="End date" />
              {item.startDate && item.endDate < item.startDate ? (
                <Text style={[styles.hint, { color: c.warn }]}>
                  The end date is before the start date, so this won’t show up.
                </Text>
              ) : (
                <Text style={[styles.hint, { color: c.muted }]}>Last day it shows up: {prettyDate(item.endDate)}.</Text>
              )}
            </>
          )}

          <Text style={[label, styles.gapTop]}>If I miss it</Text>
          <View style={[styles.seg, { backgroundColor: c.bg }]}>
            {(['carry', 'skip'] as const).map((m) => {
              const on = (item.missed ?? 'skip') === m;
              return (
                <Pressable
                  key={m}
                  onPress={() => set({ missed: m })}
                  style={[styles.segBtn, on && { backgroundColor: c.panel, shadowColor: c.ink, ...styles.segOn }]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}>
                  <Text style={{ color: c.ink, fontSize: 13, fontWeight: on ? '600' : '400' }}>
                    {m === 'carry' ? 'Carry over' : 'Let it go'}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={[styles.hint, { color: c.muted }]}>
            {item.missed === 'carry'
              ? 'A missed day stays in My Day, marked missed, until you finish it. Late check-offs don’t count toward the streak.'
              : 'A missed day disappears and the streak resets.'}
          </Text>
          <Text style={[styles.hint, { color: c.muted }]}>
            Current streak:{' '}
            <Text style={{ fontWeight: '700', color: c.ink }}>{streak(item, today, completions[item.id] ?? {})}</Text>
          </Text>
        </>
      )}
    </>
  );
}

function Stepper({
  before,
  after,
  value,
  max = 365,
  onChange,
}: {
  before: string;
  after: string;
  value: number;
  max?: number;
  onChange: (n: number) => void;
}) {
  const c = usePalette();
  const btn = (label: string, next: number, disabled: boolean) => (
    <Pressable
      accessibilityRole="button"
      onPress={() => onChange(next)}
      disabled={disabled}
      hitSlop={6}
      accessibilityLabel={`${label === '−' ? 'Decrease' : 'Increase'} ${before.toLowerCase()}${after ? ` ${after}` : ''}, currently ${value}`}
      style={[styles.stepBtn, { borderColor: c.line, backgroundColor: c.bg }, disabled && { opacity: 0.35 }]}>
      <Text style={{ color: c.ink, fontSize: 16 }}>{label}</Text>
    </Pressable>
  );
  return (
    <View style={styles.stepper}>
      <Text style={{ color: c.ink }}>{before}</Text>
      {btn('−', value - 1, value <= 1)}
      <Text style={[styles.stepVal, { color: c.ink }]} aria-live="polite">
        {value}
      </Text>
      {btn('+', value + 1, value >= max)}
      {!!after && <Text style={{ color: c.ink }}>{after}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  gapTop: { marginTop: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  day: { width: 38, alignItems: 'center', paddingHorizontal: 0 },
  hint: { fontSize: 12 },
  stepper: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  stepBtn: { width: 30, height: 30, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  stepVal: { minWidth: 24, textAlign: 'center', fontSize: 15, fontWeight: '600', fontVariant: ['tabular-nums'] },
  seg: { flexDirection: 'row', borderRadius: 8, padding: 3, gap: 3 },
  segBtn: { flex: 1, alignItems: 'center', paddingVertical: 6, borderRadius: 6 },
  segOn: { shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
});
