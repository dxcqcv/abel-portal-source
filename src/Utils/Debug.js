import { useState ,useEffect } from 'react' 
import { Leva } from 'leva'
export default function Debug() {

	const [isDebug, setIsDebug] = useState(false) 
	useEffect(() => {
		const active = window.location.hash === '#debug'	

		if(active) {
			setIsDebug(true)
		}
	}, [])	
	return (
		<Leva hidden={!isDebug} />
	)
}