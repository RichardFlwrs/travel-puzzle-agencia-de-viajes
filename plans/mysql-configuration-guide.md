# MySQL Configuration Guide for Travel Puzzle Platform

## Overview
This guide provides MySQL-specific configuration details for deploying the Travel Puzzle platform with Namecheap cPanel hosting.

---

## Why MySQL?

**cPanel Hosting (Namecheap)** only supports MySQL databases, not PostgreSQL. Fortunately, Prisma fully supports MySQL with minimal changes to our architecture.

---

## Key Differences: MySQL vs PostgreSQL with Prisma

### 1. **Datasource Provider**
```prisma
// PostgreSQL
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// MySQL
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}
```

### 2. **Connection String Format**
```bash
# PostgreSQL
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"

# MySQL
DATABASE_URL="mysql://user:password@localhost:3306/dbname"
```

### 3. **Field Type Annotations**
```prisma
// PostgreSQL
model User {
  email String @db.Text
  bio   String @db.Text
}

// MySQL - need explicit VARCHAR/TEXT
model User {
  email String @db.VarChar(255)
  bio   String @db.Text
}
```

### 4. **Decimal/Money Fields**
```prisma
// Both work similarly, but MySQL requires explicit precision
price Decimal @db.Decimal(10, 2)  // 10 digits total, 2 after decimal
```

### 5. **JSON Fields** (Future consideration)
```prisma
// PostgreSQL has native JSON support
metadata Json

// MySQL 5.7+ also supports JSON
metadata Json  // Works the same!
```

---

## Connection String Examples

### Local Development

**MAMP (macOS/Windows)**
```
DATABASE_URL="mysql://root:root@localhost:8889/travelpuzzle"
```

**XAMPP (Windows/macOS/Linux)**
```
DATABASE_URL="mysql://root:@localhost:3306/travelpuzzle"
```

**Homebrew MySQL (macOS)**
```
DATABASE_URL="mysql://root:password@localhost:3306/travelpuzzle"
```

### Production (cPanel/Namecheap)

**Standard Format**
```
DATABASE_URL="mysql://cpaneluser_dbuser:password@localhost:3306/cpaneluser_travelpuzzle"
```

**With Remote Host**
```
DATABASE_URL="mysql://cpaneluser_dbuser:password@server123.yourdomain.com:3306/cpaneluser_travelpuzzle"
```

**With SSL (if supported)**
```
DATABASE_URL="mysql://user:password@host:3306/dbname?sslaccept=strict"
```

---

## cPanel MySQL Setup Steps

### 1. Create Database
1. Log into cPanel
2. Go to **MySQL® Databases**
3. Under "Create New Database": enter `travelpuzzle`
4. Click "Create Database"
5. Note the full name (usually prefixed): `cpaneluser_travelpuzzle`

### 2. Create MySQL User
1. Scroll to "MySQL Users" section
2. Enter username: `dbadmin`
3. Generate strong password or create your own
4. Click "Create User"
5. Note full username: `cpaneluser_dbadmin`

### 3. Add User to Database
1. Scroll to "Add User To Database"
2. Select user: `cpaneluser_dbadmin`
3. Select database: `cpaneluser_travelpuzzle`
4. Click "Add"
5. On privileges page, select **ALL PRIVILEGES**
6. Click "Make Changes"

### 4. Get Connection Details
- **Database Name**: `cpaneluser_travelpuzzle`
- **Username**: `cpaneluser_dbadmin`
- **Password**: (the one you created)
- **Hostname**: Usually `localhost` (check in cPanel)
- **Port**: `3306`

### 5. Enable Remote Access (for local dev)
1. Go to **Remote MySQL®** in cPanel
2. Add your IP address or use `%` for any IP (less secure)
3. Click "Add Host"

---

## Prisma Commands with MySQL

### Initialize Prisma
```bash
npx prisma init
```

### Generate Prisma Client
```bash
npx prisma generate
```

### Create Migration
```bash
npx prisma migrate dev --name init
```

### Deploy Migration to Production
```bash
npx prisma migrate deploy
```

### Reset Database (Development Only)
```bash
npx prisma migrate reset
```

### Open Prisma Studio
```bash
npx prisma studio
```

### Seed Database (if you create seed script)
```bash
npx prisma db seed
```

---

## Production Deployment Considerations

### Environment Variables
Make sure to set these in your cPanel hosting:

1. **Node.js App Settings** (if cPanel supports Node)
2. Or create `.env` file in production directory
3. Never commit `.env` to git

```bash
DATABASE_URL="mysql://cpaneluser_dbuser:password@localhost:3306/cpaneluser_travelpuzzle"
NEXTAUTH_SECRET="production-secret-here"
NEXTAUTH_URL="https://yourdomain.com"
NODE_ENV="production"
```

### Running Migrations in Production

**Option 1: SSH Access**
```bash
ssh into cPanel
cd /home/username/public_html
npm install
npx prisma migrate deploy
```

**Option 2: From Local (with remote DB connection)**
```bash
# Set production DATABASE_URL temporarily
DATABASE_URL="mysql://user:pass@remote-host:3306/db" npx prisma migrate deploy
```

### Connection Pooling

For production with limited connections, update `src/lib/prisma.ts`:

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  // Connection pool settings for production
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

---

## Troubleshooting

### Connection Issues

**Error: "Can't reach database server"**
- Check if MySQL is running
- Verify hostname and port
- For cPanel: ensure Remote MySQL is enabled

**Error: "Access denied for user"**
- Verify username and password
- Ensure user has privileges on the database
- Check if user can connect from your IP

**Error: "Unknown database"**
- Database doesn't exist - create it first
- Check for typos in database name
- Remember cPanel prefixes (e.g., `cpaneluser_travelpuzzle`)

### Migration Issues

**Error: "Can't create table"**
- User lacks CREATE privileges
- Grant ALL PRIVILEGES to user

**Error: "Table already exists"**
- Use `npx prisma migrate resolve --applied <migration_name>`
- Or reset: `npx prisma migrate reset` (dev only)

### Performance Issues

**Slow queries in cPanel**
- Add indexes in Prisma schema (already included)
- Use `@@index()` for frequently queried fields
- Consider caching layer (Redis) if needed

---

## Testing Database Connection

### From Terminal
```bash
# Test MySQL connection
mysql -u cpaneluser_dbuser -p -h localhost cpaneluser_travelpuzzle

# If successful, you'll see:
# MySQL [(cpaneluser_travelpuzzle)]>
```

### From Node.js
```javascript
// test-db.js
const mysql = require('mysql2/promise');

async function testConnection() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'cpaneluser_dbuser',
      password: 'your-password',
      database: 'cpaneluser_travelpuzzle'
    });
    
    console.log('✅ Database connection successful!');
    await connection.end();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
}

testConnection();
```

---

## MySQL Optimization Tips

1. **Use Indexes** - Already included in schema (@@index)
2. **Connection Pooling** - Prisma handles this
3. **Prepared Statements** - Prisma uses these by default
4. **Query Optimization** - Use Prisma's `select` and `include` wisely
5. **Pagination** - Use `take` and `skip` for large datasets

---

## Next Steps

1. ✅ Complete MySQL setup (local or cPanel)
2. ✅ Update `.env` with correct DATABASE_URL
3. ✅ Run `npx prisma generate`
4. ✅ Run `npx prisma migrate dev --name init`
5. ✅ Test connection with `npx prisma studio`
6. ✅ Proceed with Phase 1 implementation

---

## Resources

- **Prisma MySQL Docs**: https://www.prisma.io/docs/concepts/database-connectors/mysql
- **cPanel Documentation**: https://docs.cpanel.net/
- **MySQL Documentation**: https://dev.mysql.com/doc/
- **MAMP**: https://www.mamp.info/
- **XAMPP**: https://www.apachefriends.org/

