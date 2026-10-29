"use client";

import { Badge } from "@nuvui/react";
import { type CalendarEvent, EventCalendar } from "@nuvui/scheduler";
import { useState } from "react";
import "./clinic-day.scss";

// Today's date, so the day is always full when the block is opened.
function today() {
  const date = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
const at = (time: string) => `${today()}T${time}`;

interface Appointment {
  patient: string;
  reason: string;
  therapist: string;
  room: string;
}

const therapists: Record<string, string> = {
  "Dr Leni Haverkamp": "2",
  "Tomas Quill": "4",
  "Priya Ashdown": "8",
};

const appointments: (Appointment & { id: string; from: string; to: string })[] =
  [
    {
      id: "a1",
      from: "08:30",
      to: "09:15",
      patient: "Oskar Brandt",
      reason: "Knee, after surgery",
      therapist: "Dr Leni Haverkamp",
      room: "Room 1",
    },
    {
      id: "a2",
      from: "08:30",
      to: "09:00",
      patient: "Wren Calloway",
      reason: "Lower back",
      therapist: "Tomas Quill",
      room: "Room 2",
    },
    {
      id: "a3",
      from: "09:15",
      to: "10:00",
      patient: "Ayo Fenwick",
      reason: "Shoulder, first visit",
      therapist: "Priya Ashdown",
      room: "Room 3",
    },
    {
      id: "a4",
      from: "09:30",
      to: "10:15",
      patient: "Hester Lowe",
      reason: "Ankle sprain",
      therapist: "Dr Leni Haverkamp",
      room: "Room 1",
    },
    {
      id: "a5",
      from: "10:00",
      to: "10:30",
      patient: "Milan Dvorak",
      reason: "Neck",
      therapist: "Tomas Quill",
      room: "Room 2",
    },
    {
      id: "a6",
      from: "11:00",
      to: "12:00",
      patient: "Group class",
      reason: "Back care, six people",
      therapist: "Priya Ashdown",
      room: "Studio",
    },
    {
      id: "a7",
      from: "13:00",
      to: "13:45",
      patient: "Rosa Ibarra",
      reason: "Hip, follow-up",
      therapist: "Dr Leni Haverkamp",
      room: "Room 1",
    },
    {
      id: "a8",
      from: "13:30",
      to: "14:00",
      patient: "Felix Achterberg",
      reason: "Tennis elbow",
      therapist: "Tomas Quill",
      room: "Room 2",
    },
    {
      id: "a9",
      from: "14:30",
      to: "15:15",
      patient: "Nadia Sorensen",
      reason: "Knee, sports",
      therapist: "Priya Ashdown",
      room: "Room 3",
    },
    {
      id: "a10",
      from: "16:00",
      to: "16:45",
      patient: "Callum Reyes",
      reason: "Shoulder, after a fall",
      therapist: "Dr Leni Haverkamp",
      room: "Room 1",
    },
  ];

const details = new Map(appointments.map((item) => [item.id, item]));

const events: CalendarEvent[] = [
  {
    id: "training",
    title: "Staff training, afternoon",
    start: today(),
    end: today(),
    allDay: true,
    color: "6",
  },
  ...appointments.map((item) => ({
    id: item.id,
    title: item.patient,
    start: at(item.from),
    end: at(item.to),
    color: therapists[item.therapist],
    description: `${item.reason}, ${item.therapist}`,
  })),
];

export default function ClinicDay() {
  const [chosen, setChosen] = useState<string | null>("a4");
  const appointment = chosen ? details.get(chosen) : undefined;

  return (
    <main className="clinic-day">
      <header className="clinic-day__head">
        <div className="clinic-day__heading">
          <h1 className="clinic-day__title">Larchmont Physio</h1>
          <p className="clinic-day__meta">Appointments, 8:00 to 18:00</p>
        </div>
        <dl className="clinic-day__figures">
          <div className="clinic-day__figure">
            <dt className="clinic-day__figure-label">Booked</dt>
            <dd className="clinic-day__figure-value">{appointments.length}</dd>
          </div>
          <div className="clinic-day__figure">
            <dt className="clinic-day__figure-label">Therapists</dt>
            <dd className="clinic-day__figure-value">
              {Object.keys(therapists).length}
            </dd>
          </div>
          <div className="clinic-day__figure">
            <dt className="clinic-day__figure-label">Free slots</dt>
            <dd className="clinic-day__figure-value">7</dd>
          </div>
        </dl>
      </header>

      <div className="clinic-day__layout">
        <EventCalendar
          aria-label="Today's appointments"
          events={events}
          views={["day", "week", "agenda"]}
          defaultView="day"
          hours={[8, 18]}
          scrollToHour={8}
          defaultPanelOpen={false}
          preferenceOptions={["twentyFourHours"]}
          className="clinic-day__calendar"
          // The appointment opens beside the day, not in the calendar's
          // popover.
          onEditStart={(event, { preventDefault }) => {
            preventDefault();
            if (details.has(event.id)) setChosen(event.id);
          }}
        />

        <aside className="clinic-day__side" aria-labelledby="clinic-day-chosen">
          <h2 className="clinic-day__subtitle" id="clinic-day-chosen">
            Appointment
          </h2>
          {appointment ? (
            <dl className="clinic-day__details">
              <div className="clinic-day__detail">
                <dt className="clinic-day__term">Patient</dt>
                <dd className="clinic-day__value">{appointment.patient}</dd>
              </div>
              <div className="clinic-day__detail">
                <dt className="clinic-day__term">Time</dt>
                <dd className="clinic-day__value">
                  {appointment.from} to {appointment.to}
                </dd>
              </div>
              <div className="clinic-day__detail">
                <dt className="clinic-day__term">For</dt>
                <dd className="clinic-day__value">{appointment.reason}</dd>
              </div>
              <div className="clinic-day__detail">
                <dt className="clinic-day__term">With</dt>
                <dd className="clinic-day__value">{appointment.therapist}</dd>
              </div>
              <div className="clinic-day__detail">
                <dt className="clinic-day__term">Where</dt>
                <dd className="clinic-day__value">
                  <Badge intent="neutral">{appointment.room}</Badge>
                </dd>
              </div>
            </dl>
          ) : (
            <p className="clinic-day__hint">
              Press an appointment to see it here.
            </p>
          )}
          <h2 className="clinic-day__subtitle">Therapists</h2>
          <ul className="clinic-day__people">
            {Object.entries(therapists).map(([name, color]) => (
              <li key={name} className="clinic-day__person">
                <span
                  aria-hidden="true"
                  className="clinic-day__swatch"
                  data-color={color}
                />
                {name}
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </main>
  );
}
