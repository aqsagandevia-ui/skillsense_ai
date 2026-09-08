export default function Stats() {
  const data = [
    { value: "500+", label: "Skills" },
    { value: "1K+", label: "Users" },
    { value: "300+", label: "Swaps" },
    { value: "20+", label: "Categories" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-20 grid grid-cols-2 md:grid-cols-4 gap-6">
      {data.map((item, i) => (
        <div
          key={i}
          className="bg-white p-6 rounded-2xl text-center shadow"
        >
          <h3 className="text-3xl font-bold text-primary">
            {item.value}
          </h3>
          <p className="text-gray-500">{item.label}</p>
        </div>
      ))}
    </div>
  );
}