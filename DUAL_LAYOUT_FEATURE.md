# Dual Layout Feature Documentation

## Overview

The MDA System now supports dual layout functionality for both User Management and MDA Management pages. Administrators can switch between **Card View** and **Table View** to display data in their preferred format.

## Features

### Layout Options

1. **Card View** (Default)

   - Visual card-based layout
   - Better for detailed information display
   - More visually appealing
   - Responsive grid layout
   - Shows comprehensive information per item

2. **Table View**
   - Compact tabular layout
   - Better for scanning large datasets
   - More data-dense display
   - Sortable columns (future enhancement)
   - Traditional spreadsheet-like view

### Layout Persistence

- User layout preferences are automatically saved to localStorage
- Separate preferences for Users and MDAs pages
- Preferences persist across browser sessions
- Defaults to Card View for new users

## Implementation Details

### Components Created

#### Core Layout Components

1. **`UserCardView.tsx`**

   - Displays users in card format
   - Shows user details, MDA associations, and actions
   - Responsive grid layout
   - Status badges and action buttons

2. **`UserTableView.tsx`**

   - Displays users in table format
   - Compact row-based display
   - Sortable columns
   - Hover effects and action buttons

3. **`MDACardView.tsx`**

   - Displays MDAs in card format
   - Shows MDA details, reports, and statistics
   - Visual report status indicators
   - External link buttons for reports

4. **`MDATableView.tsx`**

   - Displays MDAs in table format
   - Compact MDA information display
   - Report summaries with counts
   - Truncated report lists with "more" indicators

5. **`LayoutToggle.tsx`**
   - Reusable toggle component
   - Switch between Card and Table views
   - Visual active state indicators
   - Accessible button design

#### Utility Hooks

6. **`useLayoutPreference.ts`**
   - Custom hook for layout persistence
   - localStorage integration
   - Error handling for storage failures
   - Type-safe layout preferences

### Updated Pages

#### User Management Page

- Added layout toggle in header
- Conditional rendering based on layout preference
- Preserved all existing functionality
- Maintained search and filter capabilities

#### MDA Management Page

- Added layout toggle in header
- Conditional rendering based on layout preference
- Preserved all existing functionality
- Maintained statistics cards and filters

## Usage Guide

### For Administrators

1. **Accessing Layout Options**

   - Navigate to User Management or MDA Management
   - Look for the layout toggle in the page header
   - Toggle shows "Cards" and "Table" options

2. **Switching Layouts**

   - Click on "Cards" for card view
   - Click on "Table" for table view
   - Active layout is highlighted
   - Preference is automatically saved

3. **Layout Features**

   **Card View:**

   - Visual cards with comprehensive information
   - Status badges and icons
   - Action buttons (Edit, Delete, etc.)
   - Responsive grid that adapts to screen size

   **Table View:**

   - Compact rows with essential information
   - Quick scanning of multiple items
   - Sortable columns (click headers)
   - Hover effects for better UX

### For Developers

#### Adding Layout Support to New Pages

1. **Create View Components**

   ```tsx
   // ItemCardView.tsx
   interface ItemCardViewProps {
     items: Item[];
     onEdit: (item: Item) => void;
     onDelete: (item: Item) => void;
   }

   // ItemTableView.tsx
   interface ItemTableViewProps {
     items: Item[];
     onEdit: (item: Item) => void;
     onDelete: (item: Item) => void;
   }
   ```

2. **Use Layout Preference Hook**

   ```tsx
   import { useLayoutPreference } from "@/hooks/useLayoutPreference";

   const [currentLayout, setCurrentLayout] = useLayoutPreference(
     "items",
     "card"
   );
   ```

3. **Add Layout Toggle**

   ```tsx
   import LayoutToggle from "@/components/LayoutToggle";

   <LayoutToggle
     currentLayout={currentLayout}
     onLayoutChange={setCurrentLayout}
   />;
   ```

4. **Conditional Rendering**
   ```tsx
   {
     currentLayout === "card" ? (
       <ItemCardView
         items={items}
         onEdit={handleEdit}
         onDelete={handleDelete}
       />
     ) : (
       <ItemTableView
         items={items}
         onEdit={handleEdit}
         onDelete={handleDelete}
       />
     );
   }
   ```

## Technical Specifications

### Component Props

#### LayoutToggle Props

```typescript
interface LayoutToggleProps {
  currentLayout: "card" | "table";
  onLayoutChange: (layout: "card" | "table") => void;
  className?: string;
}
```

#### View Component Props

```typescript
interface ViewProps<T> {
  items: T[];
  onUpdate: (item: T) => void;
  onDelete: (item: T) => void;
  isDeleting?: boolean;
}
```

### localStorage Keys

- User layout: `layout-users`
- MDA layout: `layout-mdas`
- Custom pages: `layout-{key}`

### Styling Classes

#### Layout Toggle

- Active state: `bg-white text-gray-900 shadow-sm`
- Inactive state: `text-gray-600 hover:text-gray-900`
- Container: `bg-gray-100 rounded-lg p-1`

#### Card View

- Grid: `grid grid-cols-1 lg:grid-cols-2 gap-6`
- Card: `bg-white rounded-lg shadow-sm border border-gray-200`
- Content: `p-6`

#### Table View

- Container: `bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden`
- Table: `min-w-full divide-y divide-gray-200`
- Header: `bg-gray-50`
- Row hover: `hover:bg-gray-50`

## Browser Compatibility

- Modern browsers with localStorage support
- Graceful fallback to default layout if localStorage fails
- Responsive design works on all screen sizes
- Touch-friendly on mobile devices

## Performance Considerations

- Minimal re-renders when switching layouts
- Efficient component structure
- localStorage operations are wrapped in try-catch
- No network requests for layout changes

## Future Enhancements

### Planned Features

1. **Sortable Table Columns**

   - Click column headers to sort
   - Ascending/descending indicators
   - Multi-column sorting

2. **Column Customization**

   - Show/hide table columns
   - Reorder columns
   - Column width adjustment

3. **Bulk Actions**

   - Select multiple items in table view
   - Bulk edit/delete operations
   - Export selected items

4. **Advanced Filtering**

   - Filter panels for table view
   - Quick filter buttons
   - Saved filter presets

5. **Layout Animations**
   - Smooth transitions between layouts
   - Loading states
   - Skeleton screens

### Code Improvements

1. **Generic Components**

   - Create generic `DataView` component
   - Reduce code duplication
   - Type-safe generic implementations

2. **Performance Optimization**

   - Virtual scrolling for large datasets
   - Memoization of expensive operations
   - Lazy loading of data

3. **Accessibility**
   - ARIA labels for layout toggles
   - Keyboard navigation support
   - Screen reader compatibility

## Testing

### Manual Testing Checklist

- [ ] Layout toggle switches views correctly
- [ ] Preferences persist across page refreshes
- [ ] Both layouts display all data correctly
- [ ] All actions work in both layouts
- [ ] Responsive design works on mobile
- [ ] Error handling for localStorage failures

### Automated Testing

```typescript
// Example test cases
describe("Layout Toggle", () => {
  it("should switch between card and table views", () => {
    // Test implementation
  });

  it("should persist layout preference", () => {
    // Test implementation
  });

  it("should handle localStorage errors gracefully", () => {
    // Test implementation
  });
});
```

## Conclusion

The dual layout feature significantly enhances the user experience by providing flexible data visualization options. The implementation is robust, performant, and easily extensible to other pages in the application.

The feature maintains backward compatibility while adding modern UX patterns that users expect from contemporary admin interfaces.
