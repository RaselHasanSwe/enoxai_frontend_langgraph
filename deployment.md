# EnoX AI Frontend Deployment Guide

## 1. Update Backend API URL

Go to your local frontend project directory:

```bash
cd frontend
```

Edit the API configuration file:

```text
src/api/chat.js
```

Update the API base URL:

```javascript
const BASE_URL = "https://enoxaibe.enoxsuite.com/api/v1";
```

---

## 2. Install Dependencies

```bash
npm install
```

---

## 3. Build the Frontend

```bash
npm run build
```

This will generate the production build inside the `dist` directory.

---

## 4. Upload Build to Server

Copy the build files to the server:

```bash
scp -r ./dist ukenorsia@172.16.61.171:/srv/enoxai_frontend_langgraph
```

---

## 5. Login to the Server

```bash
ssh -i "%USERPROFILE%\.ssh\enoxsuite_login" ukenorsia@172.16.61.171
```

---

## 6. Configure Nginx

Create a new Nginx site configuration:

```bash
sudo nano /etc/nginx/sites-available/enoxai_frontend
```

Paste the following configuration:

```nginx
server {
    listen 80;
    server_name enoxaife.enoxsuite.com;

    root /srv/enoxai_frontend_langgraph/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## 7. Enable the Nginx Site

```bash
sudo ln -s /etc/nginx/sites-available/enoxai_frontend /etc/nginx/sites-enabled/
```

Validate the configuration:

```bash
sudo nginx -t
```

Reload Nginx:

```bash
sudo systemctl reload nginx
```

---

## 8. Configure SSL Certificate

Generate and configure SSL using Certbot:

```bash
sudo certbot --nginx -d enoxaife.enoxsuite.com
```

---

## 9. Configure File Permissions

Set the correct ownership:

```bash
sudo chown -R www-data:www-data /srv/enoxai_frontend_langgraph/dist
```

Set the correct permissions:

```bash
sudo chmod -R 755 /srv/enoxai_frontend_langgraph/dist
```

---

## 10. Reload Nginx

Verify and reload:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

---

## 11. Verify Deployment

Open the frontend application:

```text
https://enoxaife.enoxsuite.com
```

Verify that:

* Frontend loads successfully
* Chat UI is visible
* API requests are reaching:
  https://enoxaibe.enoxsuite.com/api/v1
* SSL certificate is valid
* Browser console contains no errors

---

## Troubleshooting

### Check Nginx Status

```bash
sudo systemctl status nginx
```

### Test Nginx Configuration

```bash
sudo nginx -t
```

### View Nginx Error Logs

```bash
sudo tail -f /var/log/nginx/error.log
```

### View Access Logs

```bash
sudo tail -f /var/log/nginx/access.log
```

### Verify Frontend Files

```bash
ls -lah /srv/enoxai_frontend_langgraph/dist
```

### Reload Nginx After Changes

```bash
sudo systemctl reload nginx
```
