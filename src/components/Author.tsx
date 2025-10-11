import React from "react";

interface AuthorProps {
  name: string;
  title: string;
  imageUrl: string;
}

export default function Author({
  name,
  title,
  imageUrl,
}: AuthorProps): JSX.Element {
  return (
    <div
      style={{
        marginBottom: "2rem",
        padding: "1rem",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <img
          src={imageUrl}
          alt={name}
          style={{ width: "50px", height: "50px", borderRadius: "50%" }}
        />
        <div>
          <div style={{ fontWeight: "bold" }}>{name}</div>
          <div style={{ fontSize: "0.9rem", opacity: 0.8 }}>{title}</div>
        </div>
      </div>
    </div>
  );
}
