import { getCategoryById } from '../config/categories'

function ItemList({ items, onDelete, onStatusChange, onEdit, category }) {
  if (items.length === 0) {
    return <p className="empty">No items yet</p>
  }

  const categoryConfig = getCategoryById(category)
  const CardComponent = categoryConfig?.CardComponent

  if (!CardComponent) {
    return <p className="empty">Category configuration not found</p>
  }

  // 템플릿: Pinned / All 분리
  if (categoryConfig.id === 'templates') {
    const pinned = items.filter(item => item.favorite)
    const rest = items.filter(item => !item.favorite)

    return (
      <div className="items-list">
        {pinned.length > 0 && (
          <>
            <p className="list-section-title">★ Pinned ({pinned.length})</p>
            {pinned.map(item => (
              <CardComponent
                key={item.id}
                template={item}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
            {rest.length > 0 && (
              <p className="list-section-title">All Templates ({rest.length})</p>
            )}
          </>
        )}
        {rest.map(item => (
          <CardComponent
            key={item.id}
            template={item}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="items-list">
      {items.map(item => {
        if (categoryConfig.id === 'documents') {
          return (
            <CardComponent
              key={item.id}
              document={item}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          )
        }

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
