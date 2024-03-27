import {Text, TouchableOpacity} from 'react-native'
import React from 'react'

const Button = ({buttontext, newStyle={}, handlePressed, width, height, backgroundColor,position, right, left, top, bottom, borderColor, borderRadius, borderWidth, justifyContent, alignItems, color, marginTop, zIndex}) => {
  return (
    <TouchableOpacity onPress={handlePressed} style={{width: width, position:position, right: right, top: top, bottom:bottom, left:left, height: height,backgroundColor: backgroundColor, borderColor: borderColor, borderWidth: borderWidth, borderRadius: borderRadius, justifyContent: justifyContent, alignItems: alignItems, marginTop: marginTop, zIndex: zIndex }}>
      <Text style={[{fontSize: 16, color: color}, newStyle ]}>{buttontext}</Text>
    </TouchableOpacity>
  )
}

export default Button