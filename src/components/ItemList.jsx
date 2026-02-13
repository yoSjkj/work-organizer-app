import { getCategoryByLabel } from '../config/categories'

function ItemList({ items, onDelete, onStatusChange, onEdit, category }) {
  if (items.length === 0) {
    return <p className="empty">등록된 항목이 없습니다</p>
  }

  const categoryConfig = getCategoryByLabel(category)
  const CardComponent = categoryConfig?.CardComponent

  if (!CardComponent) {
    return <p className="empty">카테고리 설정을 찾을 수 없습니다</p>
  }

  return (
    <div className="items-list">
      {items.map(item => {
        // 문서 카드는 document prop 사용 (기존 인터페이스 유지)
        if (categoryConfig.id === 'document') {
          return (
            <CardComponent
              key={item.id}
              document={item}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          )
        }

        // 양식 카드는 template prop 사용 (기존 인터페이스 유지)
        if (categoryConfig.id === 'template') {
          return (
            <CardComponent
              key={item.id}
              template={item}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          )
        }

        // 나머지는 item prop 사용
        return (
          <CardComponent
            key={item.id}
            item={item}
            onDelete={onDelete}
            onStatusChange={onStatusChange}
            onEdit={onEdit}
          />
        )
      })}
    </div>
  )
}

export default ItemList