"use client";

import { PlusLg, Trash3 } from "react-bootstrap-icons";
import { saveSchedule } from "@/app/admin/actions";
import { WEEK_ORDER, WEEKDAY_NAMES } from "@/lib/hours";
import type { Business, TimeRange, Weekday, WeeklySchedule } from "@/lib/types";
import { Panel, SaveBar, Switch } from "../ui";
import { useSettingsForm } from "./useSettingsForm";

const DEFAULT_RANGE: TimeRange = { open: "20:00", close: "23:30" };

export default function ScheduleForm({ business }: { business: Business }) {
  const form = useSettingsForm(
    { schedule: business.schedule, acceptOrdersWhenClosed: business.acceptOrdersWhenClosed },
    saveSchedule,
    "Horarios guardados",
  );
  const { value, update, errors } = form;

  const setDay = (day: Weekday, ranges: TimeRange[]) =>
    update({ schedule: { ...value.schedule, [day]: ranges } as WeeklySchedule });
  const setRange = (day: Weekday, index: number, patch: Partial<TimeRange>) =>
    setDay(
      day,
      value.schedule[day].map((range, i) => (i === index ? { ...range, ...patch } : range)),
    );
  const copyToOpenDays = (day: Weekday) => {
    const ranges = value.schedule[day];
    const schedule = { ...value.schedule };
    for (const other of WEEK_ORDER) if (schedule[other].length) schedule[other] = ranges.map((r) => ({ ...r }));
    update({ schedule });
  };

  return (
    <Panel
      title="Horarios"
      description="Si un horario termina después de medianoche (por ejemplo, 20:00 a 01:30), cargalo así: el sistema lo entiende."
    >
      <ul className="adm-schedule">
        {WEEK_ORDER.map((day) => {
          const ranges = value.schedule[day];
          const open = ranges.length > 0;
          return (
            <li key={day} className={`adm-day${open ? "" : " is-closed"}`}>
              <div className="adm-day-head">
                <Switch
                  checked={open}
                  onChange={(on) => setDay(day, on ? [{ ...DEFAULT_RANGE }] : [])}
                  label={WEEKDAY_NAMES[day]}
                />
                {open ? (
                  <button type="button" className="adm-text-btn" onClick={() => copyToOpenDays(day)}>
                    Copiar a los días abiertos
                  </button>
                ) : (
                  <span className="adm-muted">Cerrado</span>
                )}
              </div>
              {ranges.map((range, index) => (
                <div key={index} className="adm-range">
                  <input
                    type="time"
                    className="adm-input"
                    aria-label={`${WEEKDAY_NAMES[day]}: abre`}
                    value={range.open}
                    onChange={(e) => setRange(day, index, { open: e.target.value })}
                  />
                  <span className="adm-muted">a</span>
                  <input
                    type="time"
                    className="adm-input"
                    aria-label={`${WEEKDAY_NAMES[day]}: cierra`}
                    value={range.close}
                    onChange={(e) => setRange(day, index, { close: e.target.value })}
                  />
                  <button
                    type="button"
                    className="adm-icon-btn"
                    aria-label="Quitar franja"
                    onClick={() => setDay(day, ranges.filter((_, i) => i !== index))}
                  >
                    <Trash3 />
                  </button>
                  {errors[`schedule.${day}.${index}`] && <p className="adm-error adm-row-error">{errors[`schedule.${day}.${index}`]}</p>}
                </div>
              ))}
              {errors[`schedule.${day}`] && <p className="adm-error">{errors[`schedule.${day}`]}</p>}
              {open && ranges.length < 3 && (
                <button
                  type="button"
                  className="adm-text-btn"
                  onClick={() => setDay(day, [...ranges, { open: "11:00", close: "14:30" }])}
                >
                  <PlusLg aria-hidden /> Agregar franja
                </button>
              )}
            </li>
          );
        })}
      </ul>

      <div className="adm-switches">
        <Switch
          checked={value.acceptOrdersWhenClosed}
          onChange={(acceptOrdersWhenClosed) => update({ acceptOrdersWhenClosed })}
          label="Recibir pedidos fuera de horario"
          description="Los clientes pueden mandar el pedido igual; le avisamos que respondés cuando abras."
        />
      </div>

      <SaveBar saving={form.saving} dirty={form.dirty} onSave={form.save} />
    </Panel>
  );
}
