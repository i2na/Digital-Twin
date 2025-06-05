# Digital Twin

디지털 트윈은 현실 세계의 사물이나 공간을 가상 공간에 실시간으로 복제하여 모니터링하고 제어하는 기술입니다. 
이 레포지토리는 Autodesk의 기능을 기반으로 디지털 트윈 구현을 목표로 진행된 여러 프로젝트를 담고 있습니다.

### [`StepLED`](https://github.com/YenaLey/digital-twin/tree/main/StepLED)

ESP32 보드에 연결된 세 개의 LED를 스위치로 순차 제어하며, 이를 Autodesk Tandem에서 실시간으로 모니터링하고 Autodesk Forge Viewer 기반 가상 모델에서 제어할 수 있는 양방향 디지털 트윈 프로젝트입니다.

- 담당자 | [이예나](https://github.com/YenaLey)
- 사용 기술
  - ESP32 + Arduino
  - Autodesk Tandem
  - Autodesk Forge Viewer
  - Next.js + TypeScript

### [`ApsTokenGenerator`](https://github.com/YenaLey/digital-twin/tree/main/ApsTokenGenerator)

Autodesk Platform Services(APS)용 2-legged 및 3-legged 토큰을 손쉽게 발급할 수 있는 웹 프로젝트입니다.

- 담당자 | [이예나](https://github.com/YenaLey)
- 사용 기술
  - APS Auth API
  - Next.js + TypeScript
- 배포 링크 | [https://aps-token-generator.netlify.app](https://aps-token-generator.netlify.app)

### [`KookminDashboard`](https://github.com/YenaLey/digital-twin/tree/main/KookminDashboard)

2025 캡스톤디자인에서 진행한 국민대학교 미래관 5층 디지털 트윈 프로젝트<br />
각 교실의 온습도를 기반으로 다양한 지표를 시각화하고 자동 에어컨 제어가 가능한 대시보드

- 담당자
  - [이예나](https://github.com/YenaLey) | 풀스택 개발
  - 박기수, 이인화 | 임베디드 설계 및 연동
  - 전다빈 | BIM 및 UI·UX 디자인
- 사용 기술
  - Revit
  - Tandem Connect
  - Next.js + TypeScript + Autodesk Forge Viewer
