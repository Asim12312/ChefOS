# MongoDB Setup Guide for MenuSphere

You're seeing the MongoDB connection error because MongoDB is not running. Here are your options:

## Option 1: MongoDB Atlas (Cloud - Recommended) ⭐

**Free, easy, no installation required!**

### Steps:

1. **Create Account**
   - Go to https://www.mongodb.com/cloud/atlas/register
   - Sign up for free

2. **Create Cluster**
   - Click "Build a Database"
   - Choose "FREE" (M0 Sandbox)
   - Select a cloud provider and region (closest to you)
   - Click "Create Cluster"

3. **Create Database User**
   - Go to "Database Access" (left sidebar)
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Username: `menusphere`
   - Password: Create a strong password (save it!)
   - User Privileges: "Atlas admin"
   - Click "Add User"

4. **Whitelist IP Address**
   - Go to "Network Access" (left sidebar)
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (for development)
   - Click "Confirm"

5. **Get Connection String**
   - Go to "Database" (left sidebar)
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string (looks like):
   ```
   mongodb+srv://menusphere:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

6. **Update .env File**
   - Open `backend/.env`
   - Replace `<password>` with your actual password
   - Update the line:
   ```
   MONGODB_URI=mongodb+srv://menusphere:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/menusphere?retryWrites=true&w=majority
   ```

7. **Restart Backend**
   - Stop the backend (Ctrl+C)
   - Run `npm run dev` again

---

## Option 2: Local MongoDB (Advanced)

### Windows:
1. Download from https://www.mongodb.com/try/download/community
2. Install MongoDB Community Server
3. MongoDB will run as a service automatically
4. Keep the default `.env` setting:
   ```
   MONGODB_URI=mongodb://localhost:27017/menusphere
   ```

### Mac (using Homebrew):
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

### Linux (Ubuntu):
```bash
sudo apt-get install -y mongodb
sudo systemctl start mongodb
sudo systemctl enable mongodb
```

---

## Verify Connection

Once MongoDB is set up, you should see in the backend terminal:
```
✅ MongoDB connected successfully
🚀 Server running on port 5000
```

If you still see errors, check:
1. Connection string is correct
2. Password has no special characters (or is URL-encoded)
3. IP whitelist includes your IP
4. Database user has correct permissions

---

## Quick Test

Once connected, you can test the API:
```bash
curl http://localhost:5000/health
```

Should return:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "..."
}
```
