# Phase 1 button-card 보관 기록 — 실행 금지

> 이 문서는 역사 기록이다. 현재 Home Assistant 설치, resource 등록, dashboard import, 업데이트에 사용하면 안 된다.

Phase 1에서는 `custom:button-card`, `www/ha-design/templates.yaml`, 조명 ON/OFF SVG와 button-card template URL을 사용했다. 당시 raw editor 안내는 템플릿 다섯 종과 `light.bedroom`을 전제로 했다.

현재 `dashboards/ha-design-inline.yaml`은 장소 중심 다섯 native custom-card view를 정의하며, Phase 1 템플릿을 인라인하지 않고 `light.anbang_jomyeong`을 사용한다. 따라서 옛 Phase 1 안내를 이 파일, 현재 resource, 또는 live dashboard에 적용해서는 안 된다.

현재 절차는 [배포와 검증](../../DEPLOYMENT.md)을, 현재 resource pin은 `dashboards/*-resource.yaml`을 따른다. `www/ha-design/templates.yaml`과 조명 SVG는 기존 호환 자료로만 보존한다.
