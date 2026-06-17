import type { Category } from "@/lib/schema";
import type { RenderableImage } from "./image";

/**
 * Serializable, client-ready shape for one work row in the index. The server
 * page derives these from `ResolvedWork` (resolving the preview image once) and
 * passes them to the `WorkIndex` client island. Keeping this lean avoids
 * shipping the full work payload to the client.
 */
export type IndexEntry = {
  slug: string;
  client: string;
  title?: string;
  production?: string;
  category: Category;
  /** Resolved preview frame, or null → placeholder block. */
  preview: RenderableImage | null;
};
