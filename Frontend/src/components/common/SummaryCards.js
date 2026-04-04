import {
  FaCalendarCheck,
  FaChartSimple,
  FaFireFlameCurved,
  FaHourglassHalf,
} from 'react-icons/fa6';

const cardConfig = [
  {
    key: 'todayMinutes',
    label: "Today's Focus Time",
    formatter: (value) => `${value} min`,
    icon: FaHourglassHalf,
    tone: 'blue',
  },
  {
    key: 'completedTasksCount',
    label: 'Completed Tasks',
    formatter: (value) => value,
    icon: FaCalendarCheck,
    tone: 'green',
  },
  {
    key: 'streak',
    label: 'Current Streak',
    formatter: (value) => `${value} days`,
    icon: FaFireFlameCurved,
    tone: 'purple',
  },
  {
    key: 'upcomingTasksCount',
    label: 'Upcoming Tasks',
    formatter: (value) => value,
    icon: FaChartSimple,
    tone: 'orange',
  },
];

function SummaryCards({ stats }) {
  return (
    <section className="summary-grid">
      {cardConfig.map(({ key, label, formatter, icon: Icon, tone }) => (
        <article key={key} className={`summary-card summary-card--${tone}`}>
          <div className="summary-card__icon">
            <Icon />
          </div>
          <div>
            <span>{label}</span>
            <strong>{formatter(stats[key])}</strong>
          </div>
        </article>
      ))}
    </section>
  );
}

export default SummaryCards;
