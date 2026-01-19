function DeploymentForm({
  file,
  changes,
  target,
  status,
  onFileChange,
  onChangesChange,
  onTargetChange,
  onStatusChange,
  onSubmit
}) {
  return (
    <>
      <input
        type="text"
        placeholder="배포할 파일명 입력 (예: ha0106SaveCmd.class)"
        value={file}
        onChange={(e) => onFileChange(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && onSubmit()}
      />
      <textarea
        placeholder="변경사항 설명 (예: 쪽지 대량발송 기능 수정, 로그인 임계값 보안 패치)"
        value={changes}
        onChange={(e) => onChangesChange(e.target.value)}
        rows="3"
      />
      <div className="deployment-controls">
        <select value={target} onChange={(e) => onTargetChange(e.target.value)}>
          <option value="운영">운영 배포</option>
          <option value="테스트">테스트 배포</option>
          <option value="개발">개발 배포</option>
        </select>
        <select value={status} onChange={(e) => onStatusChange(e.target.value)}>
          <option value="진행중">진행중</option>
          <option value="완료">완료</option>
          <option value="실패">실패</option>
        </select>
      </div>
      <button onClick={onSubmit} className="add-btn">배포 기록 추가</button>
    </>
  )
}

export default DeploymentForm