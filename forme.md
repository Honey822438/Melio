POstman is used to test the api manually without having frontend 
it is used to send api request to backend


RLS is row level security sothat otheruser cannt saw or update other data just saw his own work




The issue is that dotenv.config() in server.ts runs after supabase.ts is already imported and evaluated — so the env vars aren't loaded yet when the Supabase client tries to read them.

The fix is to move dotenv.config() to the very top of server.ts, before any other imports. But since ES module imports are hoisted, the cleanest solution is to load dotenv in supabase.ts itself as a safety net:


Haan Rehan — **hamesha khud karni padegi.** Ye normal hai.

Reason simple hai:

Kiro/AI sirf **files bana sakta hai** — apne machine ya Supabase pe kuch run nahi kar sakta. Ye security reason se hai — koi bhi AI tool directly teri database ya server ko touch nahi kar sakta.

Toh workflow hamesha ye rahega:

```
Kiro → file banata hai
Tu  → run karta hai
```

Specifically:
- **SQL migrations** → tu Supabase SQL Editor mein run karega — hamesha
- **npm install** → tu terminal mein karega — hamesha  
- **Postman tests** → tu karega — hamesha
- **Server start** → tu karega — hamesha

Ye frustrating lagta hai abhi but actually **ye acha hai** — tu samajh raha hai ke andar kya ho raha hai. Blindly sab auto hota toh kuch seekhta nahi. 💪

Ja SQL run kar — phir aage badhte hain.