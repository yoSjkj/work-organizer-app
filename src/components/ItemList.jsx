import ItemCard from './ItemCard'

function ItemList({ items, onDelete, onStatusChange, onEdit }) {  // ← onEdit 추가!
  if (items.length === 0) {
    return <p className="empty">등록된 항목이 없습니다</p>
  }

  return (
    <div className="items-list">
      {items.map(item => (
        <ItemCard 
          key={item.id} 
          item={item} 
          onDelete={onDelete}
          onStatusChange={onStatusChange}
          onEdit={onEdit}  // ← 이미 있음
        />
      ))}
    </div>
  )
}

export default ItemList