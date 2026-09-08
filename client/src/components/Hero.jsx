export default function Hero() {
  return (
    <section className="pt-28 bg-gradient-to-br from-indigo-50 via-white to-emerald-50">
      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">

        <div>
          <h1 className="text-5xl font-extrabold leading-tight">
            Learn by <span className="text-primary">Sharing</span><br />
            Grow by <span className="text-secondary">Swapping</span>
          </h1>

          <p className="mt-5 text-gray-600 text-lg">
            Exchange skills with real people.  
            No money. Just learning.
          </p>

          <div className="mt-7 flex gap-4">
            <button className="bg-primary text-white px-7 py-3 rounded-xl shadow-lg">
              Start Swapping
            </button>
            <button className="border px-7 py-3 rounded-xl">
              Explore Skills
            </button>
          </div>
        </div>

        <img
          src="/images/hero.png"
          className="rounded-3xl shadow-2xl"
          alt="hero"
        />

      </div>
    </section>
  );
}
