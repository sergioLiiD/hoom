const Metric = ({ icon, value, unit }) => {
  if (!value) return null;
  return (
    <div className="flex items-center">
      {icon}
      <span>{value} {unit}</span>
    </div>
  );
};

export default Metric;
