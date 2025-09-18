
import React from 'react'

const LoadingComponent = () => {
	return (
		<svg  viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
		<path className='path' fill="none" strokeLinecap="round" strokeWidth="1" stroke="#fff"
				strokeDasharray="0,250.2"
				d="M50 10
					a 40 40 0 0 1 0 80
					a 40 40 0 0 1 0 -80"/>
		</svg>
	)
}

export default LoadingComponent  