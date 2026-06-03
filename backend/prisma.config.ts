// prisma.config.ts
import "dotenv/config";
import type { PrismaConfig } from "@prisma/config";

// Read the variable directly out of process context immediately
const migrationUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!migrationUrl) {
  throw new Error(
    "CRITICAL: Neither DIRECT_URL nor DATABASE_URL could be read by Prisma CLI."
  );
}

export default {
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: migrationUrl,
  },
} satisfies PrismaConfig;

// bug fix
// this file was changed from the normal prisma.config.ts to this format to ensure that the environment variables
// are read correctly by the Prisma CLI during migrations.
//  The original format may have caused issues with reading environment variables, leading to migration failures.
//  By directly accessing the environment variables at the top level of the configuration file, we ensure that they are available when the Prisma CLI runs,
//  thus preventing migration errors related to missing database URLs.
