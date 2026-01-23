import ItemCard from './ItemCard'
import TemplateCard from './TemplateCard'
import DocumentCard from './DocumentCard'  // ← 추가

function ItemList({ items, onDelete, onStatusChange, onEdit, isTemplate, isDocument }) {  // ← isDocument 추가
  if (items.length === 0) {
    return <p className="empty">등록된 항목이 없습니다</p>
  }

  return (
    <div className="items-list">
      {items.map(item => {
        if (isDocument) {
          return (
            <DocumentCard 
              key={item.id} 
              document={item}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          )
        } else if (isTemplate) {
          return (
            <TemplateCard 
              key={item.id} 
              template={item}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          )
        } else {
          return (
            <ItemCard 
              key={item.id} 
              item={item} 
              onDelete={onDelete}
              onStatusChange={onStatusChange}
              onEdit={onEdit}
            />
          )
        }
      })}
    </div>
  )
}

export default ItemList