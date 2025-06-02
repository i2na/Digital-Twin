# KookminDashboard

### 국민대학교 미래관 5층 온습도 모니터링 및 에어컨 제어 대시보드
<img width="1440" alt="스크린샷 2025-06-02 오후 3 02 16" src="https://github.com/user-attachments/assets/fb709330-10c6-4002-a6f2-0b651a9feb16" />

## Local
.env.local
```bash
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_FORGE_CLIENT_ID={APS Server-to-Server App Client ID}
NEXT_PUBLIC_FORGE_CLIENT_SECRET={APS Server-to-Server App Client Secret}
NEXT_PUBLIC_TANDEM_ENABLED={true 또는 false} # Tandem Stream 사용 여부
NEXT_PUBLIC_MODEL_URN={Facility URN}
NEXT_PUBLIC_SMARTTHINGS_TOKEN={SmartThings Personal access tokens}
NEXT_PUBLIC_SMARTTHINGS_DEVICE_ID={SmartThings Device ID}
```
```bash
git clone https://github.com/YenaLey/digital-twin.git
cd digital-twin/KoominDashboard
python3 -m venv venv
source venv/bin/activate
pip install pythermalcomfort==2.10.0
npm install
npm run dev
```
