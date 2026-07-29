# ModelCustom Component

`ModelCustom` renders custom pages driven by `AdminToolSerializeModel`. It provides a flexible form interface with multiple field types and action buttons.

## Features

### Core Capabilities
- **Dynamic form rendering**: Automatically generates fields from the `fields` config
- **Multiple field types**: Supports CharField, TextField, IntegerField, FloatField, BooleanField, DateField, and more
- **Action buttons**: Builds action buttons from the `actions` config
- **Multiple output types**: Supports `toast`, `display`, `download`, `refresh`, and similar response modes

### Supported Field Types

| Field Type      | Component                   | Description                               |
| --------------- | --------------------------- | ----------------------------------------- |
| `CharField`     | ProFormText / ProFormSelect | Text input or select when `choices` exist |
| `TextField`     | ProFormTextArea             | Multi-line text input                     |
| `IntegerField`  | ProFormDigit                | Integer input                             |
| `FloatField`    | ProFormDigit                | Floating-point input                      |
| `BooleanField`  | ProFormSwitch               | Toggle switch                             |
| `DateField`     | ProFormDatePicker           | Date picker                               |
| `DatetimeField` | ProFormDateTimePicker       | Date-time picker                          |
| `TimeField`     | ProFormTimePicker           | Time picker                               |

### Action Output Behavior

| Output Type | Behavior                                   |
| ----------- | ------------------------------------------ |
| `toast`     | Show success or error messages             |
| `display`   | Show returned data in a modal              |
| `download`  | Download a file when text data is returned |
| `refresh`   | Show a message and optionally refresh      |

## Usage

### Basic Example

```typescript
import { ModelCustom } from '@/components';

const MyCustomTool = () => {
    const toolDesc: API.AdminToolSerializeModel = {
        fields: {
            name: {
                type: 'CharField',
                name: 'Name',
                help_text: 'Enter your name',
                show: true,
                blank: false,
                readonly: false,
                choices: [],
                default: null
            },
            age: {
                type: 'IntegerField',
                name: 'Age',
                help_text: 'Enter your age',
                show: true,
                blank: true,
                readonly: false,
                choices: [],
                default: null
            }
        },
        actions: {
            submit: {
                name: 'submit',
                label: 'Submit',
                description: 'Submit the form',
                input: 'empty', // or 'string', 'file'
                output: 'toast',
                confirm: false,
                batch: false,
                extra: {}
            }
        },
        attrs: {
            help_text: 'Custom Form Tool',
            output_field: 'result'
        }
    };

    return (
        <ModelCustom
            toolDesc={toolDesc}
            toolName="my_custom_tool"
            onBack={() => console.log('Go back')}
        />
    );
};
```

### Route Integration

```typescript
// Use inside a route component
const CustomToolPage = () => {
    const { toolName } = useParams();
    const [toolDesc, setToolDesc] = useState<API.AdminToolSerializeModel | null>(null);

    // Fetch the tool description
    useRequest(async () => {
        const response = await getModelDesc({ name: toolName });
        if (response?.code === 0) {
            setToolDesc(response.data as API.AdminToolSerializeModel);
        }
    });

    if (!toolDesc) {
        return <div>Loading...</div>;
    }

    return (
        <ModelCustom
            toolDesc={toolDesc}
            toolName={toolName}
            onBack={() => history.back()}
        />
    );
};
```

## API

### Props

| Prop       | Type                          | Description                  | Required |
| ---------- | ----------------------------- | ---------------------------- | -------- |
| `toolDesc` | `API.AdminToolSerializeModel` | Tool description object      | ✅       |
| `toolName` | `string`                      | Tool name used for API calls | ✅       |
| `onBack`   | `() => void`                  | Back button callback         | ❌       |

### `toolDesc` Structure

```typescript
interface AdminToolSerializeModel {
    fields: Record<string, AdminField>;    // Form field configuration
    actions: Record<string, AdminAction>;  // Action button configuration
    attrs: AdminToolAttrs;                 // Tool attributes
}

interface AdminToolAttrs {
    help_text: string;      // Tool description text
    output_field: string;   // Output field name
}
```

## Custom Extensions

### Add a New Field Type

```typescript
// Add a new case in renderFormField
case 'CustomField':
    return <CustomFormComponent key={fieldName} {...commonProps} />;
```

### Add a New Output Type

```typescript
// Add a new case in executeAction
case 'custom_output':
    // Custom handling logic
    handleCustomOutput(response.data);
    break;
```

## Notes

1. **Field validation**: Required fields (`blank: false`) automatically receive validation rules
2. **Readonly fields**: Fields with `readonly: true` are disabled
3. **Choice fields**: CharField with `choices` is rendered as a select
4. **Action input**: Whether form data is required depends on `action.input`
5. **Error handling**: All API calls include error handling and user-friendly feedback

## Example Scenarios

- **Data import tool**: File upload plus processing action
- **Report generator**: Parameter input plus report generation
- **System configuration**: Settings form plus save action
- **Data analysis tool**: Query conditions plus analysis action
