export interface ProjectTemplate {
  id: string
  name: string
  description: string
  type: 'backend' | 'frontend' | 'cloud' | 'database' | 'custom'
  badge: string
  files: string[]
}

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'portfolio',
    name: 'my-portfolio',
    description: 'Designer portfolio with a small print shop - case studies, shop and checkout',
    type: 'frontend',
    badge: 'Portfolio',
    files: [
      'public/images/ (212 files)',
      'src/pages/index.tsx',
      'src/pages/work/[slug].tsx',
      'src/components/Header.tsx',
      'src/components/ContactForm.tsx',
      'src/components/Button.tsx',
      'src/pages/shop/checkout.tsx',
      'src/styles/globals.css',
      'package.json',
    ],
  },
  {
    id: 'backend-api',
    name: 'backend-api',
    description: 'Node.js & Express REST API with Prisma ORM and user database',
    type: 'backend',
    badge: 'API / Node',
    files: [
      'server.js',
      'routes/users.js',
      'routes/auth.js',
      'prisma/schema.prisma',
      'database/production.sqlite',
      'package.json',
      '.env',
    ],
  },
  {
    id: 'web-frontend',
    name: 'web-frontend',
    description: 'React 18 & TypeScript frontend with Vite, Tailwind, and components',
    type: 'frontend',
    badge: 'React / TS',
    files: [
      'src/App.tsx',
      'src/main.tsx',
      'src/components/Header.tsx',
      'src/components/UserList.tsx',
      'package.json',
      'vite.config.ts',
      'index.html',
    ],
  },
  {
    id: 'cloud-infra',
    name: 'cloud-infra',
    description: 'AWS Terraform infrastructure, S3 buckets, and CI/CD workflows',
    type: 'cloud',
    badge: 'AWS / Terraform',
    files: [
      'terraform/main.tf',
      'terraform/s3.tf',
      'terraform/iam.tf',
      '.github/workflows/deploy.yml',
      'docker-compose.yml',
      'config/aws_credentials',
    ],
  },
  {
    id: 'database-cluster',
    name: 'database-cluster',
    description: 'PostgreSQL production schema, migrations, and audit table',
    type: 'database',
    badge: 'PostgreSQL',
    files: [
      'schema.sql',
      'migrations/001_create_users.sql',
      'migrations/002_add_audit_log.sql',
      'config/database.yml',
      'scripts/backup.sh',
      'logs/audit.log',
    ],
  },
]
