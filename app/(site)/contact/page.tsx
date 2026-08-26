import type { Metadata } from "next";
import { Mail, Phone, MapPin } from "lucide-react";

export const metadata: Metadata = { title: "Contact" };

// Coordonnées à remplacer par les vraies informations HPR.
const CONTACT = {
  email: "contact@hpr.bzh",
  phone: "+33 0 00 00 00 00",
  address: "Bretagne, France",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold uppercase tracking-wide sm:text-4xl">
        Contact
      </h1>
      <p className="mt-3 max-w-xl text-muted">
        Un projet, une pièce à traiter, une question sur un procédé — écrivez-nous.
      </p>

      <div className="mt-10 space-y-4">
        <a href={`mailto:${CONTACT.email}`} className="flex items-center gap-3 text-foreground hover:text-accent">
          <Mail size={18} className="text-accent" /> {CONTACT.email}
        </a>
        <a href={`tel:${CONTACT.phone.replace(/\s+/g, "")}`} className="flex items-center gap-3 text-foreground hover:text-accent">
          <Phone size={18} className="text-accent" /> {CONTACT.phone}
        </a>
        <p className="flex items-center gap-3 text-foreground">
          <MapPin size={18} className="text-accent" /> {CONTACT.address}
        </p>
      </div>
    </div>
  );
}
