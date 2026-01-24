# 📦 Device Loaner System

A modern, premium web application for managing device loans and returns. Built with React, TypeScript, and Vite for a fast, responsive user experience.

![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.x-06B6D4?logo=tailwindcss&logoColor=white)

---

## ✨ Features

### 🛒 Multi-Device Checkout
- **Cart-based borrowing** – Add multiple devices to your cart before submitting.
- **Real-time progress tracking** – See which device is being processed during submission.
- **Per-item feedback** – Get detailed success/failure status for each device.

### 🔄 Smart Device Return
- **Autocomplete search** – Start typing your name or email to find your borrowed devices instantly.
- **Fuzzy matching** – Even with typos, the system suggests matching borrowers.
- **Multi-select returns** – Select multiple devices to return in one submission.
- **Individual API calls** – Each return is processed separately for reliability.

### 🎨 Modern UI/UX
- **Premium design** – Clean white background with a professional blue and red color scheme.
- **Responsive layout** – Works seamlessly on desktop, tablet, and mobile.
- **Smooth animations** – Micro-interactions and transitions for a polished feel.
- **Toast notifications** – Real-time feedback for all actions.

### 🔌 Flexible API Integration
- **Separate endpoints** – Configure different URLs for fetching data (GET) and submitting transactions (POST/Webhook).
- **Error handling** – Graceful error states with retry options.
- **CORS support** – Built-in handling for cross-origin requests.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18.x or higher
- **npm** 9.x or higher

### Installation

```bash
# Clone the repository
git clone https://github.com/coozgan/acad-sub-staff-loaner-form.git
cd acad-sub-staff-loaner-form

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
```

### Configuration

Edit the `.env` file with your API endpoints:

```env
# Endpoint for fetching device data (GET requests)
VITE_API_BASE_URL=https://your-api-endpoint.com/api/devices

# Endpoint for borrow/return transactions (POST requests)
# If not set, defaults to VITE_API_BASE_URL
VITE_WEBHOOK_URL=https://your-webhook-endpoint.com/transactions
```

### Development

```bash
# Start the development server
npm run dev
```

The application will be available at `http://localhost:5173`.

### Production Build

```bash
# Build for production
npm run build

# Preview the production build locally
npm run preview
```

---

## 📁 Project Structure

```
device-loan-system-v2/
├── src/
│   ├── components/
│   │   ├── BorrowForm.tsx    # Multi-device checkout with cart
│   │   ├── ReturnForm.tsx    # Smart return with autocomplete
│   │   └── Toast.tsx         # Toast notification system
│   ├── services/
│   │   └── api.ts            # API service layer
│   ├── types/
│   │   └── device.ts         # TypeScript interfaces
│   ├── App.tsx               # Main application component
│   ├── main.tsx              # Application entry point
│   └── index.css             # Global styles and design system
├── public/                   # Static assets
├── .env.example              # Environment variable template
├── package.json
├── vite.config.ts
└── README.md
```

---

## 🔧 API Integration

### Expected Device Schema

The application expects devices from your API in the following format:

```json
{
  "AssetID": "C001",
  "DeviceType": "Charger",
  "Name": "",
  "Email": "",
  "Borrowed": ""
}
```

| Field       | Description                                      |
|-------------|--------------------------------------------------|
| `AssetID`   | Unique identifier for the device                 |
| `DeviceType`| Category/type of the device                      |
| `Name`      | Borrower's name (empty if available)             |
| `Email`     | Borrower's email (empty if available)            |
| `Borrowed`  | Timestamp or status of the borrowing             |

### Borrow Request Payload (POST)

```json
{
  "AssetID": "C001",
  "DeviceType": "Charger",
  "Email": "user@example.com",
  "Name": "John Doe",
  "Reason": ""
}
```

### Return Request Payload (POST)

```json
{
  "AssetID": "C001",
  "DeviceType": "",
  "Email": "",
  "Name": "",
  "Reason": ""
}
```

---

## 🛠️ Tech Stack

| Technology   | Purpose                              |
|--------------|--------------------------------------|
| React 18     | UI component library                 |
| TypeScript   | Type-safe JavaScript                 |
| Vite         | Build tool and dev server            |
| TailwindCSS  | Utility-first CSS framework          |
| Lucide React | Modern icon library                  |

---

## 📄 License

This project is licensed under the MIT License.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📞 Support

For questions or support, please open an issue in the [GitHub repository](https://github.com/coozgan/acad-sub-staff-loaner-form/issues).
