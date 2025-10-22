import React from "react";
import styles from "./styles.module.css";

export default function BlogFooter(): React.ReactElement {
  return (
    <div className={styles.blogFooter}>
      <p>
        <em>
          If you have comments or questions, please start a discussion on the{" "}
          <a
            href="https://github.com/multigres/multigres/discussions/new?category=blog"
            target="_blank"
            rel="noopener noreferrer"
          >
            Multigres GitHub
          </a>{" "}
          repository.
        </em>
      </p>
    </div>
  );
}
