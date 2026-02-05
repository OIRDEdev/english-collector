import { Github, Twitter, Mail } from "lucide-react";

export function FooterSection() {
  return (
    <footer className="py-12 px-4 border-t border-border">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <span className="text-primary font-bold text-xl">P</span>
              </div>
              <span className="text-xl font-bold">PolyGlotFlow</span>
            </div>
            <p className="text-muted-foreground text-sm max-w-sm leading-relaxed">
              Transforme sua navegação diária em uma experiência de aprendizado. 
              A web é o seu novo livro didático.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold mb-4">Produto</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">Funcionalidades</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Preços</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Dashboard</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Extensão</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Suporte</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">FAQ</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Contato</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Privacidade</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Termos</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-border gap-4">
          <p className="text-sm text-muted-foreground">
            © 2024 PolyGlotFlow. Todos os direitos reservados.
          </p>

          {/* Badges */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary/50 rounded-full text-xs">
              <div className="w-2 h-2 bg-primary rounded-full" />
              <span className="text-muted-foreground">Chrome Web Store</span>
            </div>
          </div>

          {/* Social links */}
          <div className="flex items-center gap-3">
            <a href="#" className="w-9 h-9 rounded-lg bg-secondary/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
              <Github className="w-4 h-4" />
            </a>
            <a href="#" className="w-9 h-9 rounded-lg bg-secondary/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
              <Twitter className="w-4 h-4" />
            </a>
            <a href="#" className="w-9 h-9 rounded-lg bg-secondary/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
              <Mail className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
