import Link from 'next/link';
import { blog } from '@/lib/source';

export default function BlogIndex() {
  const posts = blog.getPages().sort((a, b) => {
    const dateA = new Date(a.data.date || 0);
    const dateB = new Date(b.data.date || 0);
    return dateB.getTime() - dateA.getTime();
  });

  return (
    <main className="mx-auto w-full max-w-[1200px] px-4 py-12 md:py-16">
      <div className="mb-12">
        <h1 className="text-4xl font-semibold mb-4">Blog</h1>
        <p className="text-fd-muted-foreground text-lg">
          Latest updates and technical deep-dives from the Multigres team.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <Link
            key={post.url}
            href={post.url}
            className="flex flex-col bg-fd-card rounded-xl border p-6 transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground"
          >
            <p className="text-xs text-fd-muted-foreground mb-2">
              {new Date(post.data.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
            <h2 className="text-lg font-medium mb-2 line-clamp-2">{post.data.title}</h2>
            <p className="text-sm text-fd-muted-foreground line-clamp-3 mb-4">
              {post.data.description}
            </p>
            <p className="mt-auto text-xs text-fd-muted-foreground">
              By {post.data.author}
            </p>
          </Link>
        ))}
      </div>
    </main>
  );
}
