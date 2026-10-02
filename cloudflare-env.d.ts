declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    ARCHIVE_ADMIN_SETUP_TOKEN?: string;
  }
}
