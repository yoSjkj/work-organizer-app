import ItemCard from './ItemCard'
import TemplateCard from './TemplateCard'

function ItemList({ items, onDelete, onStatusChange, onEdit, isTemplate }) {
  if (items.length === 0) {
    return <p className="empty">등록된 항목이 없습니다</p>
  }

  return (
    <div className="items-list">
      {items.map(item => (
        isTemplate ? (
          <TemplateCard 
            key={item.id} 
            template={item}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ) : (
          <ItemCard 
            key={item.id} 
            item={item} 
            onDelete={onDelete}
            onStatusChange={onStatusChange}
            onEdit={onEdit}
          />
        )
      ))}
    </div>
  )
}

export default ItemList