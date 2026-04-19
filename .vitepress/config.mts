import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Butterfly',
  description: 'A lightweight Go microservice framework',
  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/introduction' },
      { text: 'Stores', link: '/stores/gorm' },
      { text: 'Observability', link: '/observability/prometheus' },
      { text: 'Advanced', link: '/advanced/wire' },
    ],
    sidebar: [
      {
        text: 'Guide',
        items: [
          { text: 'Introduction', link: '/guide/introduction' },
          { text: 'Quick Start', link: '/guide/quick-start' },
          { text: 'Configuration', link: '/guide/configuration' },
          { text: 'Application Structure', link: '/guide/application-structure' },
          { text: 'HTTP Service', link: '/guide/http' },
          { text: 'gRPC Service', link: '/guide/grpc' },
        ],
      },
      {
        text: 'Data Stores',
        items: [
          { text: 'GORM (MySQL)', link: '/stores/gorm' },
          { text: 'MongoDB', link: '/stores/mongodb' },
          { text: 'Redis', link: '/stores/redis' },
          { text: 'Native SQL', link: '/stores/sql' },
          { text: 'S3 Object Storage', link: '/stores/s3' },
        ],
      },
      {
        text: 'Observability',
        items: [
          { text: 'Prometheus Metrics', link: '/observability/prometheus' },
          { text: 'OpenTelemetry Tracing', link: '/observability/tracing' },
          { text: 'Logging', link: '/observability/logging' },
        ],
      },
      {
        text: 'Advanced',
        items: [
          { text: 'Dependency Injection (Wire)', link: '/advanced/wire' },
          { text: 'Testing', link: '/advanced/testing' },
          { text: 'Deployment', link: '/advanced/deployment' },
          { text: 'FAQ', link: '/advanced/faq' },
        ],
      },
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/butterfly-go/core' },
    ],
  },
})
