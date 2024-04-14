import { Input } from './ui/input';

export const Field = ({
    labelsProps,
    inputProps,
    errors,
}: {
    labelsProps: React.LabelHTMLAttributes<HTMLLabelElement>;
    inputProps: React.InputHTMLAttributes<HTMLInputElement>;
    errors?: string[] | undefined;
}) => {
    return (
        <div className='flex flex-col gap-1'>
            <label className='text-gray-500 text-sm' {...labelsProps}>
                {labelsProps.children}
            </label>
            <Input
                {...inputProps}
            // {...getInputProps(fields.email, {
            //     type: 'email',
            // })}
            />
            {errors ? (
                <ul role='alert' className='text-red-600 flex flex-col gap-y-0.5'>
                    {errors.map((error) => (
                        <li key={error}>{error}</li>
                    ))}
                </ul>
            ) : null}
        </div>
    );
};
