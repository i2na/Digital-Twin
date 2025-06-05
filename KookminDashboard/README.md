# KookminDashboard

### 국민대학교 미래관 5층 에너지 모니터링 및 제어 대시보드

<div align="center">
  <img alt="image" src="https://github.com/user-attachments/assets/4ab788b6-2de4-4574-8c0f-0078a256e47d" width="44%"/>
  <img alt="image" src="https://github.com/user-attachments/assets/fb709330-10c6-4002-a6f2-0b651a9feb16" width="44%"/>
</div>

---

## 시스템 구성

본 대시보드는 국민대학교 교실 내 설치된 온습도 센서 및 SmartThings 에어컨을 기반으로 실시간 에너지 모니터링과 제어 기능을 제공합니다.

- 실내 온습도 센서 또는 SmartThings 에어컨 → Tandem → 웹 대시보드
- 대시보드 제어 → SmartThings 에어컨

---

## 기능 구성

### 1. 모니터링 탭

각 실별 온도, 습도, 에어컨 상태 등을 실시간으로 확인할 수 있는 화면입니다. 실내 전경 사진과 센서 상태를 시각적으로 제공합니다.
<div align="center">
  <img alt="image" src="https://github.com/user-attachments/assets/13b7761b-7ef2-4c00-8926-7b69b2e6b91f" width="44%"/>
  <img alt="image" src="https://github.com/user-attachments/assets/4ab788b6-2de4-4574-8c0f-0078a256e47d" width="44%"/>
</div>

### 2. 분석 리포트 탭

공간의 열환경 상태를 수치적으로 분석한 지표들을 제공합니다. 다음과 같은 주요 지표들을 기반으로 불쾌지수를 해석하고 자동 제어 알고리즘에 활용합니다:

- **PPD (Predicted Percentage of Dissatisfied)**: 열쾌적에 불만족을 느끼는 사람들의 비율 예측
- **DI (Discomfort Index)**: 온도와 습도를 기반으로 불쾌감을 정량화한 지수
- **냉방 부하 지수**: 냉방 필요 정도를 나타냄
- **추정 냉방 전력**: 예상되는 에너지 소비량 예측

> **자동 제어 조건**  
> DI가 72 이상(불쾌 단계 이상)일 경우 자동 제어 알고리즘이 작동하여, 쾌적 상태(69 이하)로 회복하도록 제어 명령을 생성합니다.

<div align="left">
  <img alt="image" src="https://github.com/user-attachments/assets/e47a775c-c02b-48ad-b8cf-2d53a376c0bcf" width="44%"/>
</div>

### 자동 제어 알고리즘 요약

에어컨 제어는 다음 조건 및 알고리즘을 통해 결정됩니다:

- **입력**: 실내 온도(T), 상대 습도(RH), 현재 에어컨 상태
- **목표**: 불쾌지수를 69 이하로 회복
- **절차**:
  - 불쾌지수(DI)가 75 이상일 때 제어 시작
  - 온도 감소량(ΔT)을 우선적으로 계산
  - ΔT로 부족할 경우, 제습 모드로 전환하여 습도 감소량(ΔRH)을 추가적으로 산정
  - 이에 따른 희망온도, 운전 모드("cool"/"dry"), 팬 세기, 운전 시간 등을 결정

```python
def auto_control(T, RH, state_now):
    DI_now = di(T, RH)
    if DI_now < 75.0:
        return "skip"
    delta_DI = DI_now - 69.0
    ΔT = min(delta_DI / ddi_dT(RH), max(0, T - 22.0))
    remain_DI = delta_DI - ΔT * ddi_dT(RH)
    mode = "cool" if remain_DI <= 0 else "dry"
    dry_hours = ceil(remain_DI / ddi_dRH(T) / 5.0) if remain_DI > 0 else 0
    return {
        "switch": 1,
        "setpoint": round(max(22.0, state_now["setpoint"] - ΔT)),
        "mode": mode,
        "fanMode": "max" if ΔT >= 3 else "4" if ΔT >= 2 else "3" if ΔT >= 1 else "auto",
        "optionalMode": "off",
        "duration": dry_hours * 3600 if dry_hours > 0 else 900
    }
```

### 3. 히트맵 탭

불쾌지수(DI)에 따라 실내 공간의 상태를 색상으로 시각화한 히트맵을 제공합니다. 쾌적한 공간은 시원한 블루-그린 계열로, 불쾌한 공간은 따뜻한 옐로-레드 계열로 표현되어 즉각적인 시각적 판단이 가능합니다.
<div align="left">
  <img alt="image" src="https://github.com/user-attachments/assets/f1b15ebe-fe5f-4280-80ea-cc104f839397" width="44%"/>
</div>

### 4. 에어컨 리모컨

웹 대시보드에서 에어컨을 수동으로 제어할 수 있습니다. 각 실별 현재 상태 확인 및 제어 명령 전송이 가능합니다. 또한 분석 리포트 탭에서 공간의 DI가 높을 경우, 자동 제어 알고리즘을 통해 해당 공간의 에어컨을 자동으로 제어할 수 있습니다.
<div align="left">
  <img alt="image" src="https://github.com/user-attachments/assets/77754fc3-d7d8-4054-b853-f7c9424f945c" width="30%"/>
  <img alt="image" src="https://github.com/user-attachments/assets/f35217b2-ef53-4068-8852-76194f6d4dc2" width="30%"/>
</div>

## Local
1. `.env.local` 생성
```bash
NEXT_PUBLIC_BASE_URL=http://localhost:3000 # 서버 Base Url

NEXT_PUBLIC_FORGE_CLIENT_ID= # APS Server-to-Server App Client ID
NEXT_PUBLIC_FORGE_CLIENT_SECRET= # APS Server-to-Server App Client Secret

NEXT_PUBLIC_FACILITY_URN= # Tandem Facility URN
NEXT_PUBLIC_SMARTTHINGS_TOKEN= # SmartThings Personal Access Tokens
NEXT_PUBLIC_SMARTTHINGS_DEVICE_ID= # SmartThings Device ID

NEXT_PUBLIC_TANDEM_STREAM_ENABLED=true # Tandem Stream 데이터 사용 여부
NEXT_PUBLIC_AIRCON_ENABLED=false # SmartThings 에어컨 API 사용 여부
NEXT_PUBLIC_AUTO_CONTROL_ENABLED=false # 에어컨 자동 제어 사용 여부
```
2. 설치 및 실행
```bash
python3 -m venv venv
source venv/bin/activate
pip install pythermalcomfort==2.10.0
npm install
npm run dev
```
