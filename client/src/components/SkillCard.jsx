export default function SkillCard({ skill }) {
  return (
    <div className="group bg-white rounded-3xl p-5 shadow hover:shadow-2xl transition">

      <img
        src={skill.image}
        className="rounded-2xl h-44 w-full object-cover group-hover:scale-105 transition"
      />

      <h3 className="mt-4 font-semibold text-lg">
        {skill.title}
      </h3>

      <p className="text-sm text-gray-500">
        Wants: {skill.wants}
      </p>

      <button className="mt-4 w-full bg-primary text-white py-2 rounded-xl">
        Request Swap
      </button>

    </div>
  );
}
