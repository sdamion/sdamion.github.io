import {AddressNameField,type AddressNameProps} from './AddressNameField';

export function SwapNameField(props:AddressNameProps){
  return <AddressNameField label="Swap name" saveLabel="Save Swap name" inputName="swap_name" {...props}/>;
}
