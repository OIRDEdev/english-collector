import { Quote, Star } from "lucide-react";

const testimonials = [
  {
    quote: "O PolyGlotFlow mudou como eu estudo Go e Inglês ao mesmo tempo. Consigo ler docs e já salvar os termos que não conheço.",
    author: "Lucas M.",
    role: "Desenvolvedor Fullstack",
    avatar: "L",
  },
  {
    quote: "Finalmente uma extensão que entende contexto! A explicação de gírias é perfeita para quem quer falar como nativo.",
    author: "Ana S.",
    role: "Product Designer",
    avatar: "A",
  },
  {
    quote: "Uso todo dia no Reddit e Twitter. Meu vocabulário de inglês informal cresceu 300% em 2 meses.",
    author: "Pedro C.",
    role: "Data Scientist",
    avatar: "P",
  },
];

export function SocialProofSection() {
  return (
    <section className="py-24 px-4 relative">
      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Amado por <span className="gradient-text">milhares</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Veja o que nossos usuários estão dizendo
          </p>
        </div>

        {/* Testimonials grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="glass rounded-2xl p-6 border border-border hover:border-primary/30 transition-all duration-300 hover-lift"
            >
              {/* Quote icon */}
              <Quote className="w-8 h-8 text-primary/30 mb-4" />

              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                ))}
              </div>

              {/* Quote text */}
              <p className="text-foreground leading-relaxed mb-6">
                "{testimonial.quote}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                  {testimonial.avatar}
                </div>
                <div>
                  <p className="font-semibold text-sm">{testimonial.author}</p>
                  <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
