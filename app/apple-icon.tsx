import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Pas d'arrondi ici : iOS applique lui-même le masque arrondi à l'icône
// ajoutée sur l'écran d'accueil.
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#131416",
          fontSize: 108,
          fontWeight: 800,
          color: "#5b8a9e",
        }}
      >
        H
      </div>
    ),
    { ...size },
  );
}
