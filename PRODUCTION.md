# Production Deployment Guide

This guide outlines the steps needed to deploy the Sunlit Garden API securely for use with the React Native app.

## Prerequisites

- Node.js 16+ installed
- MongoDB Atlas account or other production MongoDB setup
- Domain name for API (recommended)
- SSL certificate (recommended)

## Environment Setup

1. Copy `.env.production` to `.env`:

   ```bash
   cp .env.production .env
   ```

2. Configure the following required environment variables:
   - `MONGODB_URI`: Your production MongoDB connection string
   - `JWT_SECRET`: A strong secret key for JWT authentication
   - `ALLOWED_ORIGINS`: Your React Native app's domain(s)

## Security Measures Implemented

1. **API Security**:

   - Rate limiting (50 requests/minute per user)
   - JWT authentication with proper expiration
   - Security headers (XSS protection, HSTS, etc.)
   - Input validation and sanitization
   - Production error handling (no stack traces exposed)

2. **Database Security**:

   - Indexed collections for performance
   - Data validation rules
   - Soft deletion support
   - Version control for concurrency

3. **GraphQL Security**:
   - Disabled playground in production
   - Disabled introspection in production
   - Query complexity limits
   - Proper error formatting

## Deployment Steps

1. Build the application:

   ```bash
   npm run build
   ```

2. Run database migrations:

   ```bash
   npm run typeorm migration:run
   ```

3. Start the production server:
   ```bash
   npm run start:prod
   ```

## Production Checklist

- [ ] Configure proper MongoDB indexes
- [ ] Set up SSL/TLS certificate
- [ ] Configure CORS for React Native domains
- [ ] Set up logging service
- [ ] Configure monitoring
- [ ] Set up automated backups
- [ ] Review security headers
- [ ] Test rate limiting configuration
- [ ] Verify JWT expiration settings

## React Native Integration

1. Configure your React Native app with:

   ```typescript
   const API_URL = 'https://your-api-domain.com';
   ```

2. Include required headers:

   ```typescript
   headers: {
     'Authorization': `Bearer ${token}`,
     'Content-Type': 'application/json',
   }
   ```

3. Handle rate limiting errors:
   ```typescript
   if (error.message.includes('Too many requests')) {
     // Show appropriate message to user
   }
   ```

## Monitoring and Maintenance

1. Health Check Endpoint:

   ```
   GET /health
   ```

2. Monitor these metrics:
   - Response times
   - Error rates
   - Database performance
   - Rate limit hits
   - Authentication failures

## Performance Optimizations

1. Database:

   - Indexed fields: user_id, created_at
   - Compound indexes for common queries
   - Pagination implemented

2. API:
   - Response compression enabled
   - GraphQL query caching
   - Rate limiting per user

## Scaling Considerations

- Horizontal scaling supported
- Connection pooling configured
- Caching layer can be added
- Stateless authentication

## Security Best Practices

1. API Security:

   - Never expose stack traces
   - Validate all inputs
   - Use proper HTTP status codes
   - Implement request timeout

2. Data Security:
   - Regular backups
   - Data encryption
   - Input sanitization
   - Access control

## Support and Troubleshooting

For production issues:

1. Check logs first
2. Verify MongoDB connection
3. Check rate limiting status
4. Verify JWT authentication

## Additional Notes

- Keep JWT_SECRET secure and rotate periodically
- Monitor rate limiting effectiveness
- Regularly update dependencies
- Keep backups of MongoDB data
- Monitor API performance metrics
