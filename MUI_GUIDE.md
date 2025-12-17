# Material-UI (MUI) Setup Guide

Material-UI has been successfully installed and configured in the project.

## Installed Packages

- `@mui/material` - Core MUI components
- `@emotion/react` - CSS-in-JS library (required by MUI)
- `@emotion/styled` - Styled components (required by MUI)
- `@mui/icons-material` - Material icons

## Setup

1. **Theme Provider** - Configured in `src/main.jsx`
2. **Custom Theme** - Created in `src/theme/theme.js`
3. **CssBaseline** - Added for consistent styling across browsers

## Updated Components

- ✅ **Login Page** - Converted to use MUI components
- ✅ **Layout Component** - Converted to use MUI AppBar and Drawer

## Common MUI Components Usage

### Buttons
```jsx
import { Button } from '@mui/material';

<Button variant="contained" color="primary">Click Me</Button>
<Button variant="outlined">Outlined</Button>
<Button variant="text">Text</Button>
```

### Text Fields
```jsx
import { TextField } from '@mui/material';

<TextField
  label="Email"
  type="email"
  fullWidth
  required
/>
```

### Cards
```jsx
import { Card, CardContent, CardActions } from '@mui/material';

<Card>
  <CardContent>
    <Typography variant="h5">Title</Typography>
  </CardContent>
  <CardActions>
    <Button>Action</Button>
  </CardActions>
</Card>
```

### Tables
```jsx
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';

<TableContainer component={Paper}>
  <Table>
    <TableHead>
      <TableRow>
        <TableCell>Name</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      <TableRow>
        <TableCell>John Doe</TableCell>
      </TableRow>
    </TableBody>
  </Table>
</TableContainer>
```

### Icons
```jsx
import { Dashboard, Settings, People } from '@mui/icons-material';

<Dashboard />
<Settings />
<People />
```

### Alerts
```jsx
import { Alert } from '@mui/material';

<Alert severity="success">Success message</Alert>
<Alert severity="error">Error message</Alert>
<Alert severity="warning">Warning message</Alert>
<Alert severity="info">Info message</Alert>
```

### Dialogs/Modals
```jsx
import { Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';

<Dialog open={open} onClose={handleClose}>
  <DialogTitle>Title</DialogTitle>
  <DialogContent>
    Content here
  </DialogContent>
  <DialogActions>
    <Button onClick={handleClose}>Cancel</Button>
    <Button onClick={handleSave}>Save</Button>
  </DialogActions>
</Dialog>
```

## Theme Customization

The theme is configured in `src/theme/theme.js`. You can customize:
- Colors (primary, secondary, error, etc.)
- Typography
- Component styles
- Spacing
- Breakpoints

## Documentation

For more information, visit:
- [MUI Documentation](https://mui.com/)
- [MUI Components](https://mui.com/components/)
- [MUI Icons](https://mui.com/material-ui/material-icons/)



