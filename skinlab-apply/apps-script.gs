/**
 * Lemonderma Skin Lab Partners — 신청 폼 접수 창구
 *
 * 신청 폼(GitHub Pages)이 보낸 내용을 구글시트에 한 줄씩 append 한다.
 * 정적 페이지는 시트에 직접 못 쓰기 때문에 이 스크립트가 중간 창구 역할을 한다.
 *
 * 배포 절차는 이 파일 맨 아래 주석 참고. 3분이면 끝난다.
 */

var SPREADSHEET_ID = '1Nf7AnbkOtUbOFqHvRHn05WkkeyUEJYYw0Uw9eBcpvU8';
var SHEET_NAME = '[UAE]Skin Lab Partners 1 접수자';

// 시트 헤더(A~P)와 순서가 정확히 맞아야 한다. 헤더를 바꾸면 여기도 바꿀 것.
// A 접수일시 · B 검토상태 는 아래 doPost 에서 직접 채우므로 이 배열에 없다.
var COLUMNS = [
  'emirate',     // C 에미리트
  'name',        // D 이름
  'instagram',   // E 인스타 핸들
  'ageBand',     // F 나이대
  'skinType',    // G 피부 타입
  'sensitive',   // H 민감성 (Y/N)
  'concerns',    // I 피부 고민 (복수, 쉼표 구분)
  'kbeauty',     // J K뷰티 경험
  'lastProduct', // K 최근 구매 제품
  'lastReason',  // L 구매 이유
  'why',         // M 참여 이유
  'whatsapp',    // N 왓츠앱 번호
  'email',       // O 이메일
  'consent'      // P 동의 (Y/N)
];

/**
 * 시트는 '+' '=' '-' '@'로 시작하는 값을 수식으로 해석한다 — 왓츠앱 번호(+971…)가
 * "#ERROR! Formula parse error"로 저장되던 원인. 셀 서식을 텍스트로 바꿔도 막히지 않는다.
 * 앞에 작은따옴표를 붙이면 시트가 강제로 텍스트로 저장한다(따옴표는 화면에 안 보인다).
 */
function asText(value) {
  var s = String(value == null ? '' : value);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    // 함정 칸이 채워져 있으면 봇 → 조용히 무시
    if (data.website) {
      return ok();
    }

    // 최소 검증: 사람 손으로 채운 흔적이 없으면 버린다
    if (!data.name || !data.whatsapp || !data.email || data.consent !== 'Y') {
      return ok();
    }

    var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    if (!sheet) {
      throw new Error('시트 탭을 찾을 수 없음: ' + SHEET_NAME);
    }

    var stamp = Utilities.formatDate(new Date(), 'Asia/Dubai', 'yyyy-MM-dd HH:mm');

    var row = [stamp, '']; // A 접수일시, B 검토상태(John이 직접 채움)
    for (var i = 0; i < COLUMNS.length; i++) {
      row.push(asText(data[COLUMNS[i]] || ''));
    }

    sheet.appendRow(row);
    return ok();

  } catch (err) {
    // 실패해도 신청자에게는 티가 안 나므로, 흔적은 로그로 남긴다
    console.error('신청 접수 실패: ' + err + ' | payload: ' + (e && e.postData ? e.postData.contents : 'none'));
    return ok();
  }
}

function doGet() {
  return ContentService
    .createTextOutput('Lemonderma Skin Lab Partners — intake endpoint is live.')
    .setMimeType(ContentService.MimeType.TEXT);
}

function ok() {
  return ContentService
    .createTextOutput(JSON.stringify({ result: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * ── 배포 절차 (John, 3분) ──────────────────────────────────
 *
 * 1. 후보 DB 스프레드시트를 연다
 *    https://docs.google.com/spreadsheets/d/1Nf7AnbkOtUbOFqHvRHn05WkkeyUEJYYw0Uw9eBcpvU8/
 *
 * 2. 상단 메뉴 [확장 프로그램] → [Apps Script]
 *    열리는 편집기의 기존 코드를 전부 지우고 이 파일 내용을 그대로 붙여넣는다.
 *    저장(디스크 아이콘).
 *
 * 3. 우측 상단 [배포] → [새 배포]
 *    - 톱니바퀴 → 유형 선택 → **웹 앱**
 *    - 설명: 신청 폼 접수
 *    - 다음 사용자 인증 정보로 실행: **나**
 *    - 액세스 권한이 있는 사용자: **모든 사용자**
 *    - [배포] 클릭 → 권한 승인(본인 계정, "고급" → "안전하지 않음으로 이동" 나오면 진행)
 *
 * 4. 배포 후 나오는 **웹 앱 URL**을 복사
 *    (https://script.google.com/macros/s/AKfy..../exec 형태)
 *
 * 5. 그 URL을 Claude에게 주면 폼에 꽂아 재발행한다.
 *    직접 할 경우: plan/apply/index.html 의 ENDPOINT 한 줄만 교체 후 재발행.
 *
 * ── 동작 확인 ──
 * 배포 URL을 브라우저에 그냥 붙여넣으면
 * "Lemonderma Skin Lab Partners — intake endpoint is live." 가 떠야 정상이다.
 *
 * ── 코드를 고쳤을 때 ──
 * [배포] → [배포 관리] → 연필 → 버전 "새 버전" → [배포].
 * 새 배포를 만들면 URL이 바뀌므로 반드시 기존 배포를 수정할 것.
 */
