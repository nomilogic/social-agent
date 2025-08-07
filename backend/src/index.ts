import express, { Request, Response } from "express";
import axios from "axios";
import cors from "cors";

import * as dotenv from "dotenv";
import { get } from "http";

dotenv.config();

const app: any = express();
app.use(
  cors({
    origin: "*", // ✅ Allow frontend
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true, // ✅ if you're using cookies (optional)
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const CLIENT_ID = process.env.VITE_LINKEDIN_CLIENT_ID as string;
const CLIENT_SECRET = process.env.VITE_LINKEDIN_CLIENT_SECRET as string;
const REDIRECT_URI = "http://localhost:5173/api/oauth/linkedin/callback";
app.get("/api/oauth/linkedin", (req: Request, res: Response) => {
  console.log("Received request for LinkedIn OAuth");
  const state = Math.random().toString(36).substring(2, 15);
  const scope = "r_liteprofile%20r_emailaddress%20w_member_social";
  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(
    REDIRECT_URI
  )}&state=${state}&scope=${scope}`;
  console.log("Redirecting to LinkedIn OAuth URL:", authUrl);
  res.redirect(authUrl);
});

app.post(
  "/api/oauth/linkedin/callback2",
  async (req: Request, res: Response) => {
    console.log("Received callback from LinkedIn", req.query, req.body);
    const code = req.query.code as string;
    if (!code) {
      return res.status(400).send("Missing code");
    }

    try {
      const params = new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      });

      const tokenResponse = await axios.post<string>(
        "https://www.linkedin.com/oauth/v2/accessToken",
        params.toString(),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );

      const { access_token: accessToken } = JSON.parse(tokenResponse.data);
      console.log("Access Token:", accessToken);

      res.redirect(
        `http://localhost:5173/oauth/linkedin/success?access_token=${accessToken}`
      );
    } catch (error: any) {
      console.error(error.response?.data || error.message);
      res.redirect(
        `http://localhost:5173/oauth/linkedin/error?message=${encodeURIComponent(
          error.message
        )}`
      );
    }
  }
);

app.post('/api/oauth/linkedin/callback', async (req: Request, res: Response) => {
  console.log("Received LinkedIn OAuth callback with body:", req.body);
    let body = req.body;
  if (typeof body === 'string') {
    body = JSON.parse(body);
  }
  let getParams:{grant_type: string, code: string, redirect_uri: string} = JSON.parse(JSON.stringify(body));

  // Ensure the request body contains the necessary parameters
  console.log("Parsed parameters from request body:", getParams);
  if (!req.body) {
    return res.status(400).json({ error: 'Request body is missing' });
  }
  const { code, redirect_uri} = getParams;

  if (!code || !redirect_uri ) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }
  let newParams = {
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: redirect_uri,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET
  }
  console.log("New parameters for LinkedIn token request:", newParams);
  const params = new URLSearchParams(newParams);

  try {
   const response = await axios.post(
  'https://www.linkedin.com/oauth/v2/accessToken',
  params.toString(),
  { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
);
    res.json(response.data);
  } catch (err) {
    if (axios.isAxiosError(err)) {
      res.status(500).json({ error: err.response?.data || err.message });
    } else if (err instanceof Error) {
      res.status(500).json({ error: err.message });
    } else {
      res.status(500).json({ error: 'Unknown error' });
    }
  }
});

app.get('/api/v2/organizationalEntityAcls', async (req: Request, res: Response) => {
  //res.json({ message: 'This endpoint is deprecated. Please use /api/v2/organizationalEntityAcls with accessToken query parameter.' });
  console.log("Received request for organizationalEntityAcls with query:", req.query);
  if (!req.query.access_token) {
    return res.status(400).json({ error: 'Access token is required' }); 
  }
  const accessToken = req.query.access_token;
  if (!accessToken) {
    return res.status(400).json({ error: 'Access token is required' });
  }

  const apiUrl = 'https://api.linkedin.com/v2/organizationalEntityAcls';
  const params = new URLSearchParams({
    q: 'roleAssignee',
    role: 'ADMIN'
  });
  const response = await axios.get(`${apiUrl}?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "X-Restli-Protocol-Version": '2.0.0'
    }
  });
  res.json(response.data);
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
