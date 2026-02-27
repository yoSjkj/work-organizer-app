; Work Organizer - NSIS 커스텀 훅

!macro customInstall
  ; DSLinker 작업 스케줄러 등록 (이후 UAC 없이 실행 가능)
  ExecWait `schtasks /create /tn "WorkOrganizer-DSLinker" /tr "$\"$PROGRAMFILES32\TILON\DstationClient9\DSLinker.exe$\"" /sc once /sd 01/01/2000 /st 00:00 /rl highest /f`
!macroend

!macro customUnInstall
  ; 앱 제거 시 작업 스케줄러도 정리
  ExecWait `schtasks /delete /tn "WorkOrganizer-DSLinker" /f`
!macroend
